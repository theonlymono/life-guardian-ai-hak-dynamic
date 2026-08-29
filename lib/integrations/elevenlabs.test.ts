import assert from "node:assert/strict";
import { test } from "node:test";
import { isElevenLabsConfigured, synthesizeSpeech } from "./elevenlabs";

test("missing ElevenLabs key returns text fallback", async () => {
  const previousKey = process.env.ELEVENLABS_API_KEY;
  const previousVoice = process.env.ELEVENLABS_VOICE_ID_EN;
  delete process.env.ELEVENLABS_API_KEY;
  delete process.env.ELEVENLABS_VOICE_ID_EN;
  try {
    assert.equal(isElevenLabsConfigured(), false);
    const result = await synthesizeSpeech("Your most useful action today is ready.", "en");
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.fallback, "text");
    }
  } finally {
    if (previousKey !== undefined) process.env.ELEVENLABS_API_KEY = previousKey;
    if (previousVoice !== undefined) process.env.ELEVENLABS_VOICE_ID_EN = previousVoice;
  }
});
