"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type VoiceInputState = "idle" | "listening" | "thinking" | "analyzing" | "responding" | "done";

interface VoiceInputContextValue {
  state: VoiceInputState;
  transcript: string;
  setState: (state: VoiceInputState) => void;
  setTranscript: (text: string) => void;
  /** Placeholder for Wispr Flow integration — pass transcribed text to LIFE GUARDIAN */
  submitTranscript: (text: string) => void;
}

const VoiceInputContext = createContext<VoiceInputContextValue | null>(null);

export function VoiceInputProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VoiceInputState>("idle");
  const [transcript, setTranscript] = useState("");

  const submitTranscript = (text: string) => {
    setTranscript(text);
    setState("thinking");
  };

  return (
    <VoiceInputContext.Provider value={{ state, transcript, setState, setTranscript, submitTranscript }}>
      {children}
    </VoiceInputContext.Provider>
  );
}

export function useVoiceInput() {
  const ctx = useContext(VoiceInputContext);
  if (!ctx) throw new Error("useVoiceInput must be used within VoiceInputProvider");
  return ctx;
}
