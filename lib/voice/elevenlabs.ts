/**
 * ElevenLabs voice output helper for LIFE GUARDIAN.
 * Generates speech from conversation.voiceScript via server-side API route.
 */

export async function generateVoiceResponse(text: string): Promise<{ audioBase64: string; mimeType: string } | null> {
  try {
    const response = await fetch("/api/voice/elevenlabs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) return null;
    return (await response.json()) as { audioBase64: string; mimeType: string };
  } catch {
    return null;
  }
}
