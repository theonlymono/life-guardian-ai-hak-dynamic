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
  RiskCategory,
  RiskLevel,
  SupportedLanguage,
} from "@/lib/types/life-context"

export type TurnKind = "analyze" | "answer" | "update"

/** Step keys are fixed per turn kind so both languages render the same rows. */
export const TURN_STEPS: Record<TurnKind, readonly StepKey[]> = {
  analyze: ["stepRead", "stepRisk", "stepAction"],
  answer: ["stepUnderstand", "stepRisk", "stepAction"],
  update: ["stepMerge", "stepRisk", "stepAction"],
} as const

export type StepKey = "stepRead" | "stepUnderstand" | "stepMerge" | "stepRisk" | "stepAction"

export interface RiskMove {
  category: RiskCategory
  fromLevel: RiskLevel
  toLevel: RiskLevel
  fromScore: number
  toScore: number
}

export interface Turn {
  id: string
  kind: TurnKind
  userText: string
  assistantText: string | null
  riskMoves: RiskMove[]
  changes: string[]
  pending: boolean
  failed: boolean
}

export type FollowUpStatus = "idle" | "pending" | "scheduled" | "unavailable"

export type PanelKey = "pulse" | "known" | "actions"

interface SessionValue {
  language: SupportedLanguage
  setLanguage: (language: SupportedLanguage) => void
  openPanels: Record<PanelKey, boolean>
  togglePanel: (key: PanelKey) => void
  context: LifeContext | null
  currentAction: DailyAction | null
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
  const [language, setLanguage] = useState<SupportedLanguage>("en")
  const [context, setContext] = useState<LifeContext | null>(null)
  const [currentAction, setCurrentAction] = useState<DailyAction | null>(null)
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

  const sessionId = useRef(`session_${newId()}`)

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
      context: LifeContext
      riskMoves: RiskMove[]
    }) => {
      void postJson<ChatLogResponse>("/api/log-turn", {
        sessionId: sessionId.current,
        language,
        kind: args.kind,
        userText: args.userText,
        assistantText: args.assistantText,
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
    [language],
  )

  const reset = useCallback(() => {
    setContext(null)
    setCurrentAction(null)
    setTurns([])
    setTitle(null)
    setError(null)
    setFollowUpStatus("idle")
    setSource(null)
    setDraft("")
    sessionId.current = `session_${newId()}`
  }, [])

  const submitInput = useCallback(
    async (input: string) => {
      const trimmed = input.trim()
      if (!trimmed || loading) return

      const isFirst = context === null
      setLoading(true)
      setError(null)
      setDraft("")
      if (isFirst) setTitle(trimmed)
      const turnId = openTurn(isFirst ? "analyze" : "update", trimmed)

      try {
        const data = isFirst
          ? await postJson<AnalyzeResponse>("/api/analyze", {
              language,
              input: trimmed,
            })
          : await postJson<LifeUpdateResponse>("/api/life-update", {
              language,
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
        setSource(data.source)
        archiveTurn({
          kind: isFirst ? "analyze" : "update",
          userText: trimmed,
          assistantText: data.assistantMessage,
          action: data.dailyAction,
          context: next,
          riskMoves,
        })
      } catch {
        setError(GENERIC_ERROR[language])
        closeTurn(turnId, { failed: true })
      } finally {
        setLoading(false)
      }
    },
    [archiveTurn, closeTurn, context, language, loading, openTurn],
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
        setSource(data.source)
        archiveTurn({
          kind: "answer",
          userText: String(answer),
          assistantText: data.assistantMessage,
          action: data.nextAction,
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
