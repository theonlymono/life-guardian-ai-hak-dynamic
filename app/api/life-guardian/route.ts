import { NextRequest, NextResponse } from "next/server";
import type { LifeGuardianRequest, LifeGuardianResponse } from "@/lib/life-guardian/types";

const N8N_WEBHOOK_URL =
  process.env.N8N_LIFE_GUARDIAN_WEBHOOK_URL ??
  "https://hponekhantnaing.app.n8n.cloud/webhook/life-guardian";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LifeGuardianRequest;

    if (!body.userId?.trim()) {
      return NextResponse.json(
        { success: false, error: "missing_userId", conversation: { message: "userId is required" } },
        { status: 400 },
      );
    }
    if (!body.message?.trim()) {
      return NextResponse.json(
        { success: false, error: "empty_message", conversation: { message: "message cannot be empty" } },
        { status: 400 },
      );
    }

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: body.userId,
        message: body.message,
        locale: body.locale ?? "en-JP",
        currency: body.currency ?? "JPY",
        inputMode: body.inputMode ?? "text",
      }),
    });

    const data = (await n8nResponse.json()) as LifeGuardianResponse;
    return NextResponse.json(data, { status: n8nResponse.ok ? 200 : n8nResponse.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "backend_unavailable",
        conversation: {
          message: "LIFE GUARDIAN is temporarily unavailable. Please try again shortly.",
          tone: "supportive",
        },
      } satisfies LifeGuardianResponse,
      { status: 503 },
    );
  }
}
