import { isAiConfigured, isDemoBackupMode } from "@/lib/ai/client";
import { isN8nConfigured } from "@/lib/integrations/n8n";
import { isChatLogConfigured } from "@/lib/integrations/chat-log";
import { json } from "@/lib/api/http";
import type { HealthResponse } from "@/lib/types/api";

export async function GET() {
  const body: HealthResponse = {
    status: "ok",
    service: "Life Guardian AI",
    timestamp: new Date().toISOString(),
    aiConfigured: isAiConfigured(),
    n8nConfigured: isN8nConfigured(),
    chatLogConfigured: isChatLogConfigured(),
    demoBackupMode: isDemoBackupMode(),
  };
  return json(body);
}
