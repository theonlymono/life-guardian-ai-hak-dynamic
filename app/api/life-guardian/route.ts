import { NextRequest, NextResponse } from "next/server";
import type { LifeGuardianRequest, LifeGuardianResponse } from "@/lib/life-guardian/types";

const N8N_WEBHOOK_URL =
  process.env.N8N_LIFE_GUARDIAN_WEBHOOK_URL ??
  "https://hponekhantnaing.app.n8n.cloud/webhook/life-guardian";

const EMPTY_RESULT = {
  lifeEvents: [],
  profile: {},
  riskMap: [],
  priorities: [],
  actionPlan: { next7Days: [], next30Days: [], next3Years: [] },
  simulation: null,
  missingInformation: [],
  followUp: null,
  protectionReview: null,
} satisfies Partial<LifeGuardianResponse>;

function unavailable(error: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      conversation: {
        message: "LIFE GUARDIAN is temporarily unavailable. Please try again shortly.",
        tone: "supportive",
      },
      ...EMPTY_RESULT,
    } satisfies LifeGuardianResponse,
    { status: 503 },
  );
}

export async function POST(request: NextRequest) {
  let body: LifeGuardianRequest;
  try {
    body = (await request.json()) as LifeGuardianRequest;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "invalid_json",
        conversation: { message: "Request body must be valid JSON", tone: "supportive" },
        ...EMPTY_RESULT,
      } satisfies LifeGuardianResponse,
      { status: 400 },
    );
  }

  if (!body.userId?.trim()) {
    return NextResponse.json(
      {
        success: false,
        error: "missing_userId",
        conversation: { message: "userId is required", tone: "supportive" },
        ...EMPTY_RESULT,
      } satisfies LifeGuardianResponse,
      { status: 400 },
    );
  }
  if (!body.message?.trim()) {
    return NextResponse.json(
      {
        success: false,
        error: "empty_message",
        conversation: { message: "message cannot be empty", tone: "supportive" },
        ...EMPTY_RESULT,
      } satisfies LifeGuardianResponse,
      { status: 400 },
    );
  }

  let n8nResponse: Response;
  try {
    n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: body.userId,
        message: body.message,
        locale: body.locale ?? "en-JP",
        currency: body.currency ?? "JPY",
        inputMode: body.inputMode ?? "text",
      }),
      signal: AbortSignal.timeout(45000),
    });
  } catch {
    return unavailable("workflow_unreachable");
  }

  // An inactive or erroring workflow must never leak n8n's own error shape to the client.
  if (!n8nResponse.ok) {
    return unavailable("workflow_inactive");
  }

  try {
    const data = (await n8nResponse.json()) as LifeGuardianResponse;
    if (typeof data?.success !== "boolean") {
      return unavailable("invalid_workflow_response");
    }
    return NextResponse.json(data, { status: 200 });
  } catch {
    return unavailable("invalid_workflow_response");
  }
}
