"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type {
  AnalyzeResponse,
  ApiErrorBody,
  ChatLogResponse,
  CompleteActionResponse,
  FollowUpResponse,
  LifeUpdateResponse,
} from "@/lib/types/api"
import type {
  DailyAction,
  LifeContext,
  LifeSummary,
  SupportedLanguage,
} from "@/lib/types/life-context"
import type { RiskMove, StepKey, Turn, TurnKind } from "@/lib/types/conversation"
import type { GoalSimulation } from "@/lib/simulation/goal"
import { ensureAccount, type LocalAccount } from "@/lib/account/local-account"
import {
  clearAccountData,
  loadAccountData,
  saveAccountData,
  guestOwner,
  trim,
  upsert,
  userOwner,
  type Conversation,
  type StoredAccount,
} from "@/lib/account/storage"
import {
  fetchAccount,
  fetchHistory,
  loginRequest,
  logoutRequest,
  pushHistory,
  signupRequest,
  type AuthFailure,
  type AuthUser,
} from "@/lib/account/remote"
import { detectLanguage } from "@/lib/i18n/language"

const MAX_QUESTIONS = 5

export type { RiskMove, StepKey, Turn, TurnKind } from "@/lib/types/conversation"

/** Step keys are fixed per turn kind so both languages render the same rows. */
export const TURN_STEPS: Record<TurnKind, readonly StepKey[]> = {
  analyze: ["stepRead", "stepRisk", "stepAction"],
  answer: ["stepUnderstand", "stepRisk", "stepAction"],
  update: ["stepMerge", "stepRisk", "stepAction"],
} as const

export type FollowUpStatus = "idle" | "pending" | "scheduled" | "unavailable"

export type PanelKey = "pulse" | "known" | "actions"

interface SessionValue {
  language: SupportedLanguage
  setLanguage: (language: SupportedLanguage) => void
  openPanels: Record<PanelKey, boolean>
  togglePanel: (key: PanelKey) => void
  context: LifeContext | null
  currentAction: DailyAction | null
  summary: LifeSummary | null
  simulation: GoalSimulation | null
  account: LocalAccount | null
  user: AuthUser | null
  conversations: Conversation[]
  conversationId: string
  navOpen: boolean
  setNavOpen: (open: boolean) => void
  openConversation: (id: string) => void
  deleteConversation: (id: string) => void
  signIn: (username: string, password: string) => Promise<AuthFailure | null>
  signUp: (username: string, password: string) => Promise<AuthFailure | null>
  signOut: () => Promise<void>
  questionsAnswered: number
  questionsTotal: number
  turns: Turn[]
  title: string | null
  loading: boolean
  error: string | null
  followUpStatus: FollowUpStatus
  source: "live_ai" | "demo_backup" | null
  started: boolean
  draft: string
  setDraft: (draft: string) => void
  submitInput: (input: string) => Promise<void>
  submitAnswer: (answer: string | number | boolean) => Promise<void>
  reset: () => void
}

const SessionContext = createContext<SessionValue | null>(null)

const GENERIC_ERROR: Record<SupportedLanguage, string> = {
  en: "We couldn't reach Life Guardian. Please try again.",
  my: "Life Guardian နဲ့ ချိတ်ဆက်လို့ မရပါ။ ထပ်ကြိုးစားကြည့်ပါ။",
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Math.random())
}

async function postJson<T>(path: string, body: unknown): Promise<T | ApiErrorBody> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return (await response.json()) as T | ApiErrorBody
}

/** Surfacing what a score did is the point of the loop, so diff it every turn. */
function diffRisks(before: LifeContext | null, after: LifeContext): RiskMove[] {
  if (!before) return []
  const moves: RiskMove[] = []
  for (const risk of after.risks) {
    const previous = before.risks.find((item) => item.category === risk.category)
    if (!previous || previous.score === risk.score) continue
    moves.push({
      category: risk.category,
      fromLevel: previous.level,
      toLevel: risk.level,
      fromScore: previous.score,
      toScore: risk.score,
    })
  }
  return moves.sort((a, b) => b.toScore - a.toScore)
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en")
  // Set once the customer works the toggle themselves, after which their
  // choice outranks anything we detect.
  const [languagePinned, setLanguagePinned] = useState(false)
  const [context, setContext] = useState<LifeContext | null>(null)
  const [currentAction, setCurrentAction] = useState<DailyAction | null>(null)
  const [summary, setSummary] = useState<LifeSummary | null>(null)
  const [simulation, setSimulation] = useState<GoalSimulation | null>(null)
  const [progress, setProgress] = useState({ answered: 0, total: MAX_QUESTIONS })
  const [turns, setTurns] = useState<Turn[]>([])
  const [title, setTitle] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus>("idle")
  const [source, setSource] = useState<"live_ai" | "demo_backup" | null>(null)
  const [draft, setDraft] = useState("")
  const [openPanels, setOpenPanels] = useState<Record<PanelKey, boolean>>({
    pulse: true,
    known: false,
    actions: false,
  })
  // Only meaningful below the medium breakpoint, where the sidebar is a
  // drawer rather than a column.
  const [navOpen, setNavOpen] = useState(false)

  const sessionId = useRef(`session_${newId()}`)
  const [account, setAccount] = useState<LocalAccount | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationId, setConversationId] = useState(() => `conv_${newId()}`)
  // Nothing is written until we know who is signed in, so a guest's history
  // can never be saved into an account during the moment before /auth/me
  // answers.
  const [hydrated, setHydrated] = useState(false)

  const owner = user
    ? userOwner(user.username)
    : account
      ? guestOwner(account.id)
      : null

  const restore = useCallback((saved: Conversation) => {
    setConversationId(saved.id)
    setLanguageState(saved.language)
    setLanguagePinned(true)
    setContext(saved.context)
    setTurns(saved.turns)
    setCurrentAction(saved.action)
    setSummary(saved.summary)
    setSimulation(saved.simulation)
    setTitle(saved.title)
    setProgress({ answered: saved.answered, total: MAX_QUESTIONS })
    setError(null)
    setDraft("")
  }, [])

  const adoptStored = useCallback(
    (stored: StoredAccount) => {
      setConversations(stored.conversations)
      const active =
        stored.conversations.find((item) => item.id === stored.activeId) ??
        stored.conversations[0]
      if (active) restore(active)
    },
    [restore],
  )

  /** Wipes the screen so nothing from one owner is visible under another. */
  const clearAll = useCallback(() => {
    setConversations([])
    setConversationId(`conv_${newId()}`)
    setContext(null)
    setCurrentAction(null)
    setSummary(null)
    setSimulation(null)
    setProgress({ answered: 0, total: MAX_QUESTIONS })
    setTurns([])
    setTitle(null)
    setError(null)
    setFollowUpStatus("idle")
    setSource(null)
    setDraft("")
    setLanguagePinned(false)
  }, [])

  // Created on the client only: the id lives in this browser, so the server
  // render has nothing to say about it.
  useEffect(() => {
    const existing = ensureAccount()
    setAccount(existing)

    const guest = loadAccountData(guestOwner(existing.id))
    if (guest) adoptStored(guest)

    void (async () => {
      const me = await fetchAccount()
      if (!me) {
        setHydrated(true)
        return
      }
      setUser(me)

      // Atlas wins, because it is the copy that followed them from whatever
      // device they used last. If the account has nothing yet, the guest
      // conversations showing a moment ago are cleared rather than absorbed:
      // on a shared device they may belong to whoever sat here before.
      const remote = await fetchHistory()
      const cached = loadAccountData(userOwner(me.username))
      if (remote) adoptStored(remote)
      else if (cached) adoptStored(cached)
      else clearAll()

      setHydrated(true)
    })()
  }, [adoptStored, clearAll])

  // Keeps the customer's own copy current so a refresh, a new chat, or
  // tomorrow all leave the earlier conversations reachable. The backend stays
  // stateless; this is purely theirs.
  useEffect(() => {
    if (!owner || !hydrated || !context) return

    const current: Conversation = {
      id: conversationId,
      title,
      language,
      context,
      turns,
      action: currentAction,
      summary,
      simulation,
      answered: progress.answered,
      savedAt: new Date().toISOString(),
    }

    setConversations((existing) => {
      const next = trim({ conversations: upsert(existing, current), activeId: conversationId })
      saveAccountData(owner, next)
      // Mirrored to Atlas for signed-in accounts. Fire-and-forget: a failed
      // sync must not interrupt the conversation, and the local copy still
      // holds everything.
      if (user) void pushHistory(next)
      return next.conversations
    })
  }, [
    conversationId,
    context,
    currentAction,
    hydrated,
    language,
    owner,
    progress.answered,
    simulation,
    summary,
    title,
    turns,
    user,
  ])

  const setLanguage = useCallback((next: SupportedLanguage) => {
    setLanguagePinned(true)
    setLanguageState(next)
  }, [])

  /**
   * Signing in adopts whatever the account already holds. If it holds nothing
   * yet, the conversation on screen stays and becomes that account's first
   * saved history — nobody loses the story they just told by signing in.
   */
  const adopt = useCallback(
    async (result: { user: AuthUser | null; reason?: AuthFailure }): Promise<AuthFailure | null> => {
      if (!result.user) return result.reason ?? "unavailable"

      setUser(result.user)

      const remote = await fetchHistory()
      const cached = loadAccountData(userOwner(result.user.username))
      if (remote) adoptStored(remote)
      else if (cached) adoptStored(cached)
      // Nothing stored yet. Whatever is on screen was told as a guest — the
      // sign-in card is only reachable when signed out, and signing out wipes
      // the screen — so it belongs to nobody else and becomes theirs. That
      // way you never lose the story you just told by creating an account.

      return null
    },
    [adoptStored],
  )

  const signIn = useCallback(
    async (username: string, password: string) => adopt(await loginRequest(username, password)),
    [adopt],
  )

  const signUp = useCallback(
    async (username: string, password: string) => adopt(await signupRequest(username, password)),
    [adopt],
  )

  /**
   * Leaves nothing of this account behind on the device. The cached copy is
   * deleted rather than kept for a faster return: their history is safe in
   * Atlas, and the next person to use this browser must not find it.
   */
  const signOut = useCallback(async () => {
    if (user) clearAccountData(userOwner(user.username))
    await logoutRequest()
    setUser(null)
    clearAll()

    if (account) {
      const guest = loadAccountData(guestOwner(account.id))
      if (guest) adoptStored(guest)
    }
  }, [account, adoptStored, clearAll, user])

  const togglePanel = useCallback((key: PanelKey) => {
    setOpenPanels((panels) => ({ ...panels, [key]: !panels[key] }))
  }, [])

  // Drives the :lang(my) metrics in globals.css that keep Burmese from
  // overflowing containers sized for Latin.
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const openTurn = useCallback((kind: TurnKind, userText: string): string => {
    const id = newId()
    setTurns((items) => [
      ...items,
      {
        id,
        kind,
        userText,
        assistantText: null,
        riskMoves: [],
        changes: [],
        pending: true,
        failed: false,
      },
    ])
    return id
  }, [])

  const closeTurn = useCallback((id: string, patch: Partial<Turn>) => {
    setTurns((items) =>
      items.map((turn) => (turn.id === id ? { ...turn, ...patch, pending: false } : turn)),
    )
  }, [])

  /**
   * Archives the turn in MongoDB via n8n. Deliberately not awaited and never
   * surfaced: losing an audit record is not worth interrupting the customer.
   */
  const archiveTurn = useCallback(
    (args: {
      kind: TurnKind
      userText: string
      assistantText: string
      action: DailyAction | null
      summary?: LifeSummary | null
      context: LifeContext
      riskMoves: RiskMove[]
    }) => {
      void postJson<ChatLogResponse>("/api/log-turn", {
        sessionId: sessionId.current,
        accountId: account?.id,
        language,
        kind: args.kind,
        userText: args.userText,
        // The closing turn's real content lives in the summary card, so the
        // archive would otherwise store only the lead-in sentence.
        assistantText: args.summary
          ? [
              args.assistantText,
              args.summary.headline,
              args.summary.situation,
              ...args.summary.priorities.map((item) => `${item.focus}: ${item.why}`),
              ...args.summary.plan.map(
                (step, index) =>
                  `${index + 1}. ${step.title} (${step.timeframe}) — ${step.detail}`,
              ),
              args.summary.caution,
            ].join("\n\n")
          : args.assistantText,
        action: args.action
          ? {
              focus: args.action.focus,
              question: args.action.question,
              topicKey: args.action.topicKey,
            }
          : undefined,
        risks: args.context.risks.map((risk) => ({
          category: risk.category,
          score: risk.score,
          level: risk.level,
        })),
        riskMoves: args.riskMoves,
      }).catch(() => undefined)
    },
    [account, language],
  )

  /**
   * Starts a new conversation. The one on screen is already saved under its
   * own id, so it stays in the history list — beginning a new chat is not a
   * way to throw the last one away.
   */
  const reset = useCallback(() => {
    setConversationId(`conv_${newId()}`)
    setContext(null)
    setCurrentAction(null)
    setSummary(null)
    setSimulation(null)
    setProgress({ answered: 0, total: MAX_QUESTIONS })
    setTurns([])
    setTitle(null)
    setError(null)
    setFollowUpStatus("idle")
    setSource(null)
    setDraft("")
    // A new conversation should read the next story fresh rather than inherit
    // a language the previous one settled on.
    setLanguagePinned(false)
    sessionId.current = `session_${newId()}`
  }, [])

  const openConversation = useCallback(
    (id: string) => {
      const found = conversations.find((item) => item.id === id)
      if (!found) return
      restore(found)
      setFollowUpStatus("idle")
      setSource(null)
      sessionId.current = `session_${newId()}`
    },
    [conversations, restore],
  )

  /** Removes one conversation. The rest of the history is untouched. */
  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((existing) => {
        const next = existing.filter((item) => item.id !== id)
        if (owner) {
          if (next.length === 0) clearAccountData(owner)
          else saveAccountData(owner, { conversations: next, activeId: conversationId })
        }
        if (user) void pushHistory({ conversations: next, activeId: conversationId })
        return next
      })
      if (id === conversationId) reset()
    },
    [conversationId, owner, reset, user],
  )

  const submitInput = useCallback(
    async (input: string) => {
      const trimmed = input.trim()
      if (!trimmed || loading) return

      // Someone typing Burmese has told us which language they want more
      // plainly than the toggle has. Detection only ever moves toward Burmese:
      // Latin script is no evidence either way, since romanised Burmese is
      // common, so it never drags a Burmese session back to English.
      const active = !languagePinned ? (detectLanguage(trimmed) ?? language) : language
      if (active !== language) setLanguageState(active)

      const isFirst = context === null
      setLoading(true)
      setError(null)
      setDraft("")
      if (isFirst) setTitle(trimmed)
      const turnId = openTurn(isFirst ? "analyze" : "update", trimmed)

      try {
        const data = isFirst
          ? await postJson<AnalyzeResponse>("/api/analyze", {
              language: active,
              input: trimmed,
            })
          : await postJson<LifeUpdateResponse>("/api/life-update", {
              language: active,
              input: trimmed,
              context,
            })

        if (!data.success) {
          setError(data.error.message)
          closeTurn(turnId, { failed: true })
          return
        }

        const next = "context" in data ? data.context : data.updatedContext
        const riskMoves = diffRisks(context, next)
        closeTurn(turnId, {
          assistantText: data.assistantMessage,
          riskMoves,
          changes: "changesDetected" in data ? data.changesDetected : [],
        })
        setContext(next)
        setCurrentAction(data.dailyAction)
        setSummary(data.summary)
        setSimulation(data.simulation)
        setProgress({ answered: data.questionsAnswered, total: data.questionsTotal })
        setSource(data.source)
        archiveTurn({
          kind: isFirst ? "analyze" : "update",
          userText: trimmed,
          assistantText: data.assistantMessage,
          action: data.dailyAction,
          summary: data.summary,
          context: next,
          riskMoves,
        })
      } catch {
        setError(GENERIC_ERROR[active])
        closeTurn(turnId, { failed: true })
      } finally {
        setLoading(false)
      }
    },
    [archiveTurn, closeTurn, context, language, languagePinned, loading, openTurn],
  )

  const submitAnswer = useCallback(
    async (answer: string | number | boolean) => {
      if (!context || !currentAction || loading) return

      setLoading(true)
      setError(null)
      const turnId = openTurn("answer", String(answer))

      try {
        const data = await postJson<CompleteActionResponse>("/api/complete-action", {
          language,
          context,
          action: currentAction,
          answer,
        })

        if (!data.success) {
          setError(data.error.message)
          closeTurn(turnId, { failed: true })
          return
        }

        const riskMoves = diffRisks(context, data.updatedContext)
        closeTurn(turnId, {
          assistantText: data.assistantMessage,
          riskMoves,
        })
        setContext(data.updatedContext)
        setCurrentAction(data.nextAction)
        setSummary(data.summary)
        setSimulation(data.simulation)
        setProgress({ answered: data.questionsAnswered, total: data.questionsTotal })
        setSource(data.source)
        archiveTurn({
          kind: "answer",
          userText: String(answer),
          assistantText: data.assistantMessage,
          action: data.nextAction,
          summary: data.summary,
          context: data.updatedContext,
          riskMoves,
        })

        // n8n schedules the follow-up. A failure here must not affect the answer.
        setFollowUpStatus("pending")
        void postJson<FollowUpResponse>("/api/follow-up", {
          sessionId: sessionId.current,
          language,
          context: data.updatedContext,
          completedAction: data.updatedContext.completedActions.at(-1),
          nextAction: data.nextAction,
        })
          .then((followUp) => {
            const scheduled =
              "workflowStatus" in followUp && followUp.workflowStatus === "scheduled"
            setFollowUpStatus(scheduled ? "scheduled" : "unavailable")
          })
          .catch(() => setFollowUpStatus("unavailable"))
      } catch {
        setError(GENERIC_ERROR[language])
        closeTurn(turnId, { failed: true })
      } finally {
        setLoading(false)
      }
    },
    [archiveTurn, closeTurn, context, currentAction, language, loading, openTurn],
  )

  const value = useMemo<SessionValue>(
    () => ({
      language,
      setLanguage,
      openPanels,
      togglePanel,
      context,
      currentAction,
      summary,
      simulation,
      account,
      user,
      conversations,
      conversationId,
      navOpen,
      setNavOpen,
      openConversation,
      deleteConversation,
      signIn,
      signUp,
      signOut,
      questionsAnswered: progress.answered,
      questionsTotal: progress.total,
      turns,
      title,
      loading,
      error,
      followUpStatus,
      source,
      started: context !== null || turns.length > 0,
      draft,
      setDraft,
      submitInput,
      submitAnswer,
      reset,
    }),
    [
      language,
      openPanels,
      togglePanel,
      context,
      currentAction,
      summary,
      simulation,
      account,
      user,
      conversations,
      conversationId,
      navOpen,
      openConversation,
      deleteConversation,
      signIn,
      signUp,
      signOut,
      progress,
      turns,
      title,
      loading,
      error,
      followUpStatus,
      source,
      draft,
      submitInput,
      submitAnswer,
      reset,
    ],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession must be used within SessionProvider")
  return ctx
}
