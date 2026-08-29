import { errorMessage } from "@/lib/i18n/language";
import type { SpeakFallbackResponse, SpeakSuccessResponse } from "@/lib/types/api";
import type { SupportedLanguage } from "@/lib/types/life-context";

export function isElevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID_EN);
}

export async function synthesizeSpeech(
  text: string,
  language: SupportedLanguage,
): Promise<SpeakSuccessResponse | SpeakFallbackResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId =
    language === "my"
      ? process.env.ELEVENLABS_VOICE_ID_MY || process.env.ELEVENLABS_VOICE_ID_EN
      : process.env.ELEVENLABS_VOICE_ID_EN;

  if (!apiKey || !voiceId) {
    return {
      success: false,
      fallback: "text",
      message: errorMessage("ELEVENLABS_FAILED", language),
    };
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75,
          },
        }),
        signal: AbortSignal.timeout(20000),
      },
    );

    if (!response.ok) {
      return {
        success: false,
        fallback: "text",
        message: errorMessage("ELEVENLABS_FAILED", language),
      };
    }

    const audio = Buffer.from(await response.arrayBuffer());
    return {
      success: true,
      language,
      contentType: "audio/mpeg",
      audioBase64: audio.toString("base64"),
    };
  } catch {
    return {
      success: false,
      fallback: "text",
      message: errorMessage("ELEVENLABS_FAILED", language),
    };
  }
}
