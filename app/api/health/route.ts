import { isAiConfigured, isDemoBackupMode } from "@/lib/ai/client";
import { isElevenLabsConfigured } from "@/lib/integrations/elevenlabs";
import { isN8nConfigured } from "@/lib/integrations/n8n";
import { json } from "@/lib/api/http";
import type { HealthResponse } from "@/lib/types/api";

export async function GET() {
  const body: HealthResponse = {
    status: "ok",
    service: "Life Guardian AI",
    timestamp: new Date().toISOString(),
    aiConfigured: isAiConfigured(),
    elevenLabsConfigured: isElevenLabsConfigured(),
    n8nConfigured: isN8nConfigured(),
    demoBackupMode: isDemoBackupMode(),
  };
  return json(body);
}
