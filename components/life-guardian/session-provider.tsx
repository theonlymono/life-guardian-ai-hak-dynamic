"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type {
  AnalyzeResponse,
  ApiErrorBody,
  CompleteActionResponse,
  FollowUpResponse,
  LifeUpdateResponse,
} from "@/lib/types/api"
import type {
  DailyAction,
  LifeContext,
  SupportedLanguage,
} from "@/lib/types/life-context"

export type SessionView = "today" | "pulse" | "actions" | "history"

export interface ThreadItem {
  id: string
  role: "assistant" | "user"
  text: string
}

export type FollowUpStatus = "idle" | "pending" | "scheduled" | "unavailable"

interface SessionValue {
  language: SupportedLanguage
  setLanguage: (language: SupportedLanguage) => void
  view: SessionView
  setView: (view: SessionView) => void
  context: LifeContext | null
  currentAction: DailyAction | null
  thread: ThreadItem[]
  changesDetected: string[]
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

export function SessionProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<SupportedLanguage>("en")
  const [view, setView] = useState<SessionView>("today")
  const [context, setContext] = useState<LifeContext | null>(null)
  const [currentAction, setCurrentAction] = useState<DailyAction | null>(null)
  const [thread, setThread] = useState<ThreadItem[]>([])
  const [changesDetected, setChangesDetected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus>("idle")
  const [source, setSource] = useState<"live_ai" | "demo_backup" | null>(null)
  const [draft, setDraft] = useState("")

  const sessionId = useRef(`session_${newId()}`)

  const append = useCallback((role: ThreadItem["role"], text: string) => {
    setThread((items) => [...items, { id: newId(), role, text }])
  }, [])

  const reset = useCallback(() => {
    setContext(null)
    setCurrentAction(null)
    setThread([])
    setChangesDetected([])
    setError(null)
    setFollowUpStatus("idle")
    setSource(null)
    setDraft("")
    setView("today")
    sessionId.current = `session_${newId()}`
  }, [])

  const submitInput = useCallback(
    async (input: string) => {
      const trimmed = input.trim()
      if (!trimmed || loading) return

      setLoading(true)
      setError(null)
      append("user", trimmed)
      setDraft("")

      try {
        // The first message analyses a life story; later ones merge into the context.
        const data = context
          ? await postJson<LifeUpdateResponse>("/api/life-update", {
              language,
              input: trimmed,
              context,
            })
          : await postJson<AnalyzeResponse>("/api/analyze", {
              language,
              input: trimmed,
            })

        if (!data.success) {
          setError(data.error.message)
          return
        }

        setContext("context" in data ? data.context : data.updatedContext)
        setCurrentAction(data.dailyAction)
        setChangesDetected("changesDetected" in data ? data.changesDetected : [])
        setSource(data.source)
        append("assistant", data.assistantMessage)
        setView("today")
      } catch {
        setError(GENERIC_ERROR[language])
      } finally {
        setLoading(false)
      }
    },
    [append, context, language, loading],
  )

  const submitAnswer = useCallback(
    async (answer: string | number | boolean) => {
      if (!context || !currentAction || loading) return

      setLoading(true)
      setError(null)
      append("user", String(answer))

      try {
        const data = await postJson<CompleteActionResponse>("/api/complete-action", {
          language,
          context,
          action: currentAction,
          answer,
        })

        if (!data.success) {
          setError(data.error.message)
          return
        }

        setContext(data.updatedContext)
        setCurrentAction(data.nextAction)
        setSource(data.source)
        append("assistant", data.assistantMessage)

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
      } finally {
        setLoading(false)
      }
    },
    [append, context, currentAction, language, loading],
  )

  const value = useMemo<SessionValue>(
    () => ({
      language,
      setLanguage,
      view,
      setView,
      context,
      currentAction,
      thread,
      changesDetected,
      loading,
      error,
      followUpStatus,
      source,
      started: context !== null,
      draft,
      setDraft,
      submitInput,
      submitAnswer,
      reset,
    }),
    [
      language,
      view,
      context,
      currentAction,
      thread,
      changesDetected,
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
