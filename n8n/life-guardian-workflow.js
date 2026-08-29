import { workflow, node, trigger, ifElse, expr, newCredential } from '@n8n/workflow-sdk';

// ─── Code: Normalize Request ───────────────────────────────────────────────
const normalizeJs = `
const raw = $input.first().json;
const body = raw.body || raw;
const userId = String(body.userId || '').trim();
const message = String(body.message || '').trim();
const locale = body.locale || 'en-JP';
const currency = body.currency || 'JPY';
const inputMode = body.inputMode || 'text';

if (!userId) {
  return [{ json: { valid: false, error: 'missing_userId', errorMessage: 'userId is required' } }];
}
if (!message) {
  return [{ json: { valid: false, error: 'empty_message', errorMessage: 'message cannot be empty' } }];
}

return [{ json: { valid: true, userId, message, locale, currency, inputMode } }];
`;

// ─── Code: Load User State ─────────────────────────────────────────────────
const loadStateJs = `
const input = $input.first().json;
const staticData = $getWorkflowStaticData('global');
if (!staticData.users) staticData.users = {};

const existing = staticData.users[input.userId] || {
  userId: input.userId,
  profile: {},
  activeRisks: [],
  goals: [],
  conversationContext: {},
  lastInteraction: null,
  nextCheckIn: null,
};

const extractionPrompt = \`Analyze this life planning message and extract structured facts ONLY from what is stated or clearly implied. Never invent numbers or facts.

User message: "\${input.message}"
Locale: \${input.locale}
Currency: \${input.currency}
Previous profile: \${JSON.stringify(existing.profile || {})}
Previous conversation context: \${JSON.stringify(existing.conversationContext || {})}

Return JSON with this exact structure:
{
  "intent": "new_life_event|follow_up|what_if|general_assessment|provide_information",
  "lifeEvents": [{"type": "job_loss|job_change|income_decrease|new_job|career_change|marriage|divorce|new_baby|dependent_added|dependent_removed|aging_parent|parent_care|healthcare_concern|long_term_care|child_university|education_funding|buying_house|mortgage|moving|major_purchase|approaching_retirement|retirement_planning|debt_increase|savings_concern|income_instability|general", "confidence": 0.0, "details": {}}],
  "userProfile": {"age": null, "income": null, "monthlyIncome": null, "monthlyEssentialExpenses": null, "dependents": null, "spouseWorking": null, "mortgage": null, "savings": null, "debt": null, "currentAge": null, "retirementAge": null, "currentSavings": null, "targetSavings": null, "educationSavings": null, "educationTarget": null, "yearsToUniversity": null, "monthlyContribution": null, "parents": []},
  "financialGoals": [],
  "timeHorizon": [],
  "concerns": [],
  "missingInformation": [],
  "whatIfParams": {"monthlyContribution": null, "retirementAge": null}
}

Rules:
- Put unknown values in missingInformation, use null in userProfile
- Detect intent from message type
- For what-if messages extract monthlyContribution if mentioned
- Merge with previous context when user provides follow-up numbers\`;

return [{ json: { ...input, userState: existing, extractionPrompt } }];
`;

// ─── Code: Validate Extraction ─────────────────────────────────────────────
const validateJs = `
const prev = $('Load User State').first().json;
const aiRaw = $input.first().json;
let extraction = null;
let aiError = null;

try {
  const text = aiRaw.output || aiRaw.text || aiRaw.message?.content || aiRaw.response || JSON.stringify(aiRaw);
  const match = typeof text === 'string' ? text.match(/\\{[\\s\\S]*\\}/) : null;
  extraction = JSON.parse(match ? match[0] : (typeof text === 'string' ? text : JSON.stringify(text)));
} catch (e) {
  aiError = 'invalid_ai_json';
  extraction = {
    intent: 'new_life_event',
    lifeEvents: [{ type: 'general', confidence: 0.3, details: {} }],
    userProfile: {},
    financialGoals: [],
    timeHorizon: [],
    concerns: [],
    missingInformation: ['Could not parse life event details — please share more context'],
    whatIfParams: {},
  };
}

const profile = { ...(prev.userState.profile || {}), ...(extraction.userProfile || {}) };
Object.keys(profile).forEach((k) => { if (profile[k] === null || profile[k] === undefined) delete profile[k]; });

const ctx = { ...(prev.userState.conversationContext || {}) };
if (extraction.intent === 'what_if' && extraction.whatIfParams?.monthlyContribution) {
  ctx.monthlyContribution = extraction.whatIfParams.monthlyContribution;
}
if (profile.educationSavings) ctx.educationSavings = profile.educationSavings;
if (profile.yearsToUniversity) ctx.yearsToUniversity = profile.yearsToUniversity;
if (profile.monthlyContribution) ctx.monthlyContribution = profile.monthlyContribution;
if (extraction.lifeEvents?.length) ctx.activeTopic = extraction.lifeEvents[0].type;

return [{ json: { ...prev, extraction, profile, conversationContext: ctx, aiError } }];
`;

// ─── Code: Risk Engine ─────────────────────────────────────────────────────
const riskJs = `
const d = $input.first().json;
const events = (d.extraction?.lifeEvents || []).map((e) => e.type);
const p = d.profile || {};
const risks = {};
const add = (cat, pts, reason, evidence) => {
  if (!risks[cat]) risks[cat] = { category: cat, score: 0, reasons: [], evidence: [] };
  risks[cat].score += pts;
  risks[cat].reasons.push(reason);
  risks[cat].evidence = [...new Set([...risks[cat].evidence, ...evidence])];
};
const has = (t) => events.includes(t);
const dependents = p.dependents || 0;

if (has('job_loss') || has('income_decrease') || has('income_instability')) {
  add('finance', 35, 'Income disruption affects financial stability', ['income loss']);
  add('income_protection', 30, 'Household income may be at risk', ['income loss']);
}
if (has('job_loss') && dependents > 0) { add('finance', 20, 'Dependents rely on stable income', ['dependents', 'job loss']); add('family', 25, 'Family financial security affected', ['dependents']); add('income_protection', 25, 'Single or reduced income with dependents', ['dependents']); }
if ((has('job_loss') || has('income_instability')) && p.mortgage) { add('housing', 30, 'Mortgage obligations with unstable income', ['mortgage', 'income']); add('finance', 15, 'Mortgage adds fixed expense pressure', ['mortgage']); }
if (has('mortgage') || has('buying_house')) { add('housing', 20, 'Major housing financial commitment', ['mortgage']); }
if (has('new_baby') || has('dependent_added')) { add('family', 35, 'New dependent increases family responsibilities', ['new child']); add('healthcare', 20, 'Healthcare and protection needs may increase', ['new child']); add('education', 15, 'Long-term education planning begins', ['new child']); }
if (has('child_university') || has('education_funding')) { add('education', 40, 'Education funding timeline approaching', ['education']); add('finance', 15, 'Education requires significant savings', ['education']); }
if (has('aging_parent') || has('parent_care') || has('long_term_care')) { add('caregiving', 35, 'Aging parent may need future care', ['aging parent']); add('healthcare', 25, 'Healthcare and care planning needed', ['aging parent']); add('finance', 15, 'Care costs may affect household finances', ['aging parent']); }
if (has('healthcare_concern')) { add('healthcare', 30, 'Healthcare concern identified', ['healthcare']); }
if (has('approaching_retirement') || has('retirement_planning')) { add('retirement', 35, 'Retirement planning horizon', ['retirement']); add('finance', 15, 'Retirement savings adequacy', ['retirement']); }
if (p.currentAge >= 55 && (has('retirement_planning') || has('approaching_retirement'))) { add('retirement', 20, 'Age 55+ with retirement goals', ['retirement', 'age']); }
if (p.spouseWorking === false || p.spouseWorking === 'false') { add('income_protection', 25, 'Household depends primarily on one income', ['single income']); add('family', 15, 'Single-income household vulnerability', ['single income']); }
if (has('debt_increase') || has('major_purchase')) { add('finance', 25, 'Increased financial obligations', ['debt']); }
if (has('marriage') || has('divorce')) { add('family', 30, 'Major family structure change', ['family change']); add('finance', 15, 'Financial arrangements may need review', ['family change']); }
if (has('savings_concern')) { add('finance', 25, 'Savings adequacy concern', ['savings']); }
if (events.length === 0 || has('general')) { add('finance', 10, 'General life assessment — gather more context', ['general']); }

const level = (s) => s >= 70 ? 'CRITICAL' : s >= 50 ? 'HIGH' : s >= 30 ? 'MEDIUM' : 'LOW';
const riskMap = Object.values(risks).map((r) => ({
  category: r.category,
  level: level(r.score),
  score: Math.min(100, r.score),
  reason: r.reasons[0],
  evidence: r.evidence,
})).sort((a, b) => b.score - a.score);

return [{ json: { ...d, riskMap } }];
`;

// ─── Code: Priority Engine ─────────────────────────────────────────────────
const priorityJs = `
const d = $input.first().json;
const events = (d.extraction?.lifeEvents || []).map((e) => e.type);
const p = d.profile || {};
const riskMap = d.riskMap || [];

const scoreRisk = (cat) => {
  const r = riskMap.find((x) => x.category === cat);
  const base = r ? r.score : 0;
  let urgency = base / 100;
  let impact = base / 100;
  let timeSensitivity = 0.3;
  let dependency = 0.3;

  if (cat === 'education' && (p.yearsToUniversity <= 3 || events.includes('child_university'))) { timeSensitivity = 0.9; urgency = Math.max(urgency, 0.85); }
  if (cat === 'income_protection' && (events.includes('job_loss') || p.spouseWorking === false)) { urgency = Math.max(urgency, 0.9); impact = Math.max(impact, 0.85); }
  if (cat === 'caregiving' && events.includes('aging_parent')) { timeSensitivity = 0.6; }
  if (cat === 'finance' && events.includes('job_loss')) { urgency = Math.max(urgency, 0.95); }
  if (cat === 'retirement' && p.currentAge >= 50) { timeSensitivity = 0.7; }

  const priorityScore = urgency * 0.35 + impact * 0.35 + timeSensitivity * 0.20 + dependency * 0.10;
  return { category: cat, priorityScore, urgency, impact, timeSensitivity, dependency };
};

const cats = [...new Set(riskMap.map((r) => r.category))];
const scored = cats.map(scoreRisk).sort((a, b) => b.priorityScore - a.priorityScore);
const reasons = {
  education: 'University or education funding timeline is approaching',
  income_protection: 'Household depends on stable income protection',
  caregiving: 'Aging parent may require future care planning',
  finance: 'Financial stability needs immediate attention',
  housing: 'Housing obligations require income stability',
  family: 'Family responsibilities need structured preparation',
  healthcare: 'Healthcare planning should be reviewed',
  retirement: 'Retirement timeline requires active planning',
};

const priorities = scored.slice(0, 3).map((s, i) => ({
  rank: i + 1,
  category: s.category,
  reason: reasons[s.category] || 'Identified life risk area',
  priorityScore: Math.round(s.priorityScore * 100),
}));

return [{ json: { ...d, priorities } }];
`;

// ─── Code: Financial Engine ────────────────────────────────────────────────
const financialJs = `
const d = $input.first().json;
const p = d.profile || {};
const ctx = d.conversationContext || {};
const events = (d.extraction?.lifeEvents || []).map((e) => e.type);
const intent = d.extraction?.intent;
let simulation = null;
const disclaimers = ['These figures are estimates only, not financial guarantees. Consult a qualified advisor for major decisions.'];

const monthlyContrib = p.monthlyContribution || ctx.monthlyContribution || d.extraction?.whatIfParams?.monthlyContribution;

// Education simulation
if (events.includes('child_university') || events.includes('education_funding') || ctx.activeTopic === 'child_university' || ctx.educationSavings) {
  const current = p.educationSavings || ctx.educationSavings || p.currentSavings || 0;
  const target = p.educationTarget || p.targetSavings || 3000000;
  const years = p.yearsToUniversity || ctx.yearsToUniversity || 3;
  const monthly = monthlyContrib || 0;
  const futureContrib = monthly * 12 * years;
  const projected = current + futureContrib;
  const gap = Math.max(0, target - projected);
  const requiredMonthly = gap > 0 && years > 0 ? Math.ceil(gap / (12 * years)) : 0;
  simulation = { scenario: 'education', currentSavings: current, target, years, monthlyContribution: monthly, projectedAmount: projected, gap, requiredMonthlyContribution: requiredMonthly, disclaimers };
}

// Retirement simulation
if (events.includes('retirement_planning') || events.includes('approaching_retirement')) {
  const currentAge = p.currentAge || p.age || 55;
  const retirementAge = p.retirementAge || 60;
  const current = p.currentSavings || p.savings || 0;
  const target = p.targetSavings || 35000000;
  const years = Math.max(0, retirementAge - currentAge);
  const scenarios = [
    { name: 'Save ¥100K/month', monthlySaving: 100000, projectedSavings: current + 100000 * 12 * years, gap: Math.max(0, target - (current + 100000 * 12 * years)) },
    { name: 'Save ¥150K/month', monthlySaving: 150000, projectedSavings: current + 150000 * 12 * years, gap: Math.max(0, target - (current + 150000 * 12 * years)) },
    { name: 'Delay retirement to 63', retirementAge: 63, monthlySaving: 100000, projectedSavings: current + 100000 * 12 * Math.max(0, 63 - currentAge), gap: Math.max(0, target - (current + 100000 * 12 * Math.max(0, 63 - currentAge))) },
  ];
  simulation = { scenario: 'retirement', currentAge, retirementAge, currentSavings: current, targetSavings: target, scenarios, disclaimers };
}

// Cash-flow / job loss
if (events.includes('job_loss') || events.includes('income_decrease')) {
  const savings = p.savings || 0;
  const expenses = p.monthlyEssentialExpenses || 0;
  const income = p.monthlyIncome || 0;
  const monthlyBurn = expenses > 0 ? expenses : (income > 0 ? expenses : 0);
  const runway = monthlyBurn > 0 ? Math.floor(savings / monthlyBurn) : null;
  simulation = { scenario: 'cash_flow', savings, monthlyEssentialExpenses: monthlyBurn, monthlyIncome: income, emergencyRunwayMonths: runway, monthlyBurnRate: monthlyBurn, disclaimers };
}

// What-if override for education
if (intent === 'what_if' && monthlyContrib && (ctx.educationSavings || p.educationSavings)) {
  const current = p.educationSavings || ctx.educationSavings || 1500000;
  const target = p.educationTarget || 3000000;
  const years = p.yearsToUniversity || ctx.yearsToUniversity || 3;
  const projected = current + monthlyContrib * 12 * years;
  simulation = { scenario: 'education_what_if', currentSavings: current, target, monthlyContribution: monthlyContrib, projectedAmount: projected, gap: Math.max(0, target - projected), disclaimers };
}

return [{ json: { ...d, simulation } }];
`;

// ─── Code: Action Plan + Follow-Up ─────────────────────────────────────────
const actionJs = `
const d = $input.first().json;
const events = (d.extraction?.lifeEvents || []).map((e) => e.type);
const intent = d.extraction?.intent;
const top = d.priorities?.[0]?.category;
const sim = d.simulation;

let next7 = [];
let next30 = [];
let next3y = [];
let followUp = { required: false, days: 30, reason: 'Routine life planning check-in' };
let protectionReview = null;

if (intent === 'general_assessment') {
  next7 = ['Answer 3 quick questions about your biggest responsibility, upcoming events, and concerns'];
} else if (events.includes('job_loss')) {
  next7 = ['Review emergency savings balance', 'List essential monthly expenses', 'Estimate emergency runway in months', 'Review existing income protection'];
  next30 = ['Explore interim income options', 'Review mortgage payment flexibility', 'Schedule 30-day financial check-in'];
  followUp = { required: true, days: 30, reason: 'Review financial stability after job loss', message: 'How is your financial situation progressing?' };
  if (d.profile?.dependents > 0 || d.profile?.spouseWorking === false) {
    protectionReview = { recommended: true, reason: 'Household depends on stable income', category: 'income_protection' };
  }
} else if (events.includes('new_baby') || events.includes('dependent_added')) {
  next7 = ['Review health coverage for new dependent', 'Update emergency fund target', 'Discuss parental leave impact'];
  next30 = ['Review family protection plan', 'Start education savings discussion'];
  next3y = ['Plan education savings approach'];
  followUp = { required: true, days: 90, reason: 'Review family protection after new baby', message: "Let's review the family protection plan." };
} else if (events.includes('child_university') || events.includes('education_funding')) {
  next7 = ['Confirm education savings target', 'Calculate monthly savings needed', 'Review timeline to university'];
  next30 = ['Set up automatic savings if possible', 'Review education funding options'];
  followUp = { required: true, days: 30, reason: 'Review education savings progress', message: 'Would you like to revisit your education savings target?' };
} else if (events.includes('aging_parent') || events.includes('parent_care')) {
  next7 = ['Discuss family care preferences', 'Review parent health situation', 'Estimate potential care cost range'];
  next30 = ['Explore care planning resources', 'Discuss with family members'];
  followUp = { required: true, days: 30, reason: 'Follow up on parent care planning', message: 'Have you had a chance to discuss the family care plan?' };
} else if (events.includes('retirement_planning')) {
  next7 = ['Review current retirement savings', 'Compare target vs projected savings', 'Explore scenario options'];
  next30 = ['Adjust monthly savings if needed', 'Review retirement timeline'];
  followUp = { required: true, days: 60, reason: 'Retirement planning progress check', message: 'Would you like to review your retirement progress?' };
} else if (events.includes('buying_house') || events.includes('mortgage')) {
  next7 = ['Review down payment readiness', 'Calculate affordable monthly payment', 'Ensure emergency fund remains intact'];
  next30 = ['Review income stability', 'Assess protection needs for mortgage'];
  protectionReview = { recommended: true, reason: 'Major housing commitment requires income stability review', category: 'housing' };
} else {
  next7 = ['Identify your most time-sensitive life priority', 'Gather missing financial details', 'Focus on priority #1 first'];
  next30 = ['Build a preparation plan for top risk area'];
}

if (top && !events.includes('general')) {
  next7.unshift('Focus first on: ' + top.replace('_', ' '));
}

const actionPlan = { next7Days: next7, next30Days: next30, next3Years: next3y };

return [{ json: { ...d, actionPlan, followUp, protectionReview } }];
`;

// ─── Code: Assemble Response ───────────────────────────────────────────────
const assembleJs = `
const d = $input.first().json;
const conv = d.conversationText || '';
const top = d.priorities?.[0];
const lifeEventsRaw = d.extraction?.lifeEvents || [];

let message = conv;
if (!message) {
  const topCat = top ? top.category.replace('_', ' ') : 'your situation';
  message = lifeEventsRaw.length > 1
    ? "You've got several important responsibilities happening at once. You don't need to solve everything today. Let's start with " + topCat + "."
    : "I understand what you're going through. Let's focus on what matters most right now.";
}

const events = lifeEventsRaw.map((e) => ({ type: e.type, confidence: e.confidence, details: e.details || {} }));

const response = {
  success: true,
  conversation: { message, tone: 'supportive', voiceScript: d.voiceScript || message },
  lifeEvents: events,
  profile: d.profile || {},
  riskMap: d.riskMap || [],
  priorities: d.priorities || [],
  actionPlan: d.actionPlan || { next7Days: [], next30Days: [], next3Years: [] },
  simulation: d.simulation || null,
  missingInformation: d.extraction?.missingInformation || [],
  followUp: d.followUp || null,
  protectionReview: d.protectionReview || null,
  conversationContext: d.conversationContext || {},
  intent: d.extraction?.intent || 'new_life_event',
  voice: { enabled: false, audioUrl: null, mimeType: null },
  meta: { locale: d.locale, currency: d.currency, inputMode: d.inputMode, aiError: d.aiError || null },
};

if (d.extraction?.intent === 'general_assessment') {
  response.assessmentQuestions = [
    'What is your biggest financial responsibility?',
    'Is there an important life event coming within the next 3 years?',
    'What is your biggest concern right now?',
  ];
}

return [{ json: response }];
`;

// ─── Code: Save User State ─────────────────────────────────────────────────
const saveStateJs = `
const resp = $input.first().json;
const staticData = $getWorkflowStaticData('global');
if (!staticData.users) staticData.users = {};

const userId = resp.profile?.userId || $('Load User State').first().json.userId;
staticData.users[userId] = {
  userId,
  profile: resp.profile,
  activeRisks: resp.riskMap || [],
  goals: resp.priorities || [],
  conversationContext: resp.conversationContext || {},
  lastInteraction: new Date().toISOString(),
  nextCheckIn: resp.followUp?.required ? new Date(Date.now() + (resp.followUp.days || 30) * 86400000).toISOString() : null,
};

return [{ json: resp }];
`;

// ─── Code: Error Response ────────────────────────────────────────────────────
const errorJs = `
const d = $input.first().json;
return [{ json: {
  success: false,
  error: d.error,
  conversation: { message: d.errorMessage, tone: 'supportive' },
  lifeEvents: [], profile: {}, riskMap: [], priorities: [],
  actionPlan: { next7Days: [], next30Days: [], next3Years: [] },
  simulation: null, missingInformation: [], followUp: null, protectionReview: null,
} }];
`;

// ─── AI System Prompts ───────────────────────────────────────────────────────
const extractSystem = `You are LIFE GUARDIAN AI extraction engine. Extract ONLY facts stated in the user message. Never invent numbers. Return valid JSON only. Use null for unknown values and list gaps in missingInformation. Detect multiple simultaneous life events. Support intents: new_life_event, follow_up, what_if, general_assessment, provide_information.`;

const conversationSystem = `You are LIFE GUARDIAN AI — a calm, warm, supportive life companion (NOT an insurance salesperson).

Write a short empathetic conversational message (2-4 sentences) AND a voiceScript (1-2 sentences, 10-30 seconds when spoken).

Rules:
- Never recommend specific insurance products
- Never present estimates as guarantees
- For multiple risks say: "You don't need to solve everything today. Let's start with #1."
- Be proactive about preparation, not sales
- If general_assessment intent, ask 3 high-value questions naturally
- Include runway/simulation numbers if provided in context
- Mark estimates clearly

Return JSON: {"message": "...", "voiceScript": "..."}`;

// ─── Nodes ─────────────────────────────────────────────────────────────────
const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Life Guardian Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'life-guardian',
      responseMode: 'responseNode',
      options: { allowedOrigins: '*' },
    },
  },
});

const normalizeRequest = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Normalize Request', parameters: { mode: 'runOnceForAllItems', jsCode: normalizeJs } },
});

const checkValid = ifElse({
  version: 2.2,
  config: {
    name: 'Valid Input?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.valid }}'), operator: { type: 'boolean', operation: 'true' }, rightValue: '' }],
        combinator: 'and',
      },
    },
  },
});

const loadUserState = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Load User State', parameters: { mode: 'runOnceForAllItems', jsCode: loadStateJs } },
});

const aiExtract = node({
  type: '@n8n/n8n-nodes-langchain.googleGemini',
  version: 1.2,
  config: {
    name: 'AI Life Event Parser',
    parameters: {
      resource: 'text',
      operation: 'message',
      modelId: { __rl: true, mode: 'id', value: 'models/gemini-3.5-flash-lite' },
      simplify: true,
      jsonOutput: true,
      messages: {
        values: [{ role: 'user', content: expr('{{ $json.extractionPrompt }}') }],
      },
      builtInTools: { googleSearch: false, urlContext: false, codeExecution: false },
      options: {
        temperature: 0.1,
        maxOutputTokens: 2000,
        systemMessage: extractSystem,
      },
    },
    credentials: { googlePalmApi: newCredential('Google Gemini') },
  },
});

const validateExtraction = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Structured Validator', parameters: { mode: 'runOnceForAllItems', jsCode: validateJs } },
});

const riskEngine = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Deterministic Risk Engine', parameters: { mode: 'runOnceForAllItems', jsCode: riskJs } },
});

const priorityEngine = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Priority Engine', parameters: { mode: 'runOnceForAllItems', jsCode: priorityJs } },
});

const financialEngine = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Financial What-If Engine', parameters: { mode: 'runOnceForAllItems', jsCode: financialJs } },
});

const actionFollowUp = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Action Plan & Follow-Up', parameters: { mode: 'runOnceForAllItems', jsCode: actionJs } },
});

const buildConvPrompt = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Conversation Prompt',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `
const d = $input.first().json;
const prompt = 'Generate conversational response for LIFE GUARDIAN AI.\\n\\nUser message: ' + d.message + '\\nIntent: ' + (d.extraction?.intent || '') + '\\nTop priority: ' + JSON.stringify(d.priorities?.[0] || {}) + '\\nRisk map: ' + JSON.stringify(d.riskMap || []) + '\\nSimulation: ' + JSON.stringify(d.simulation || null) + '\\nAction plan: ' + JSON.stringify(d.actionPlan || {}) + '\\nMissing info: ' + JSON.stringify(d.extraction?.missingInformation || []);
return [{ json: { ...d, conversationPrompt: prompt } }];
`,
    },
  },
});

const aiConversation = node({
  type: '@n8n/n8n-nodes-langchain.googleGemini',
  version: 1.2,
  config: {
    name: 'AI Conversation Generator',
    parameters: {
      resource: 'text',
      operation: 'message',
      modelId: { __rl: true, mode: 'id', value: 'models/gemini-3.5-flash-lite' },
      simplify: true,
      jsonOutput: true,
      messages: {
        values: [{ role: 'user', content: expr('{{ $json.conversationPrompt }}') }],
      },
      builtInTools: { googleSearch: false, urlContext: false, codeExecution: false },
      options: {
        temperature: 0.4,
        maxOutputTokens: 800,
        systemMessage: conversationSystem,
      },
    },
    credentials: { googlePalmApi: newCredential('Google Gemini') },
  },
});

const parseConversation = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Parse Conversation',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `
const prev = $('Build Conversation Prompt').first().json;
const aiRaw = $input.first().json;
let conversationText = '';
let voiceScript = '';
try {
  const text = aiRaw.output || aiRaw.text || aiRaw.content?.parts?.[0]?.text || aiRaw.message?.content || aiRaw.response || JSON.stringify(aiRaw);
  const match = typeof text === 'string' ? text.match(/\\{[\\s\\S]*\\}/) : null;
  const parsed = JSON.parse(match ? match[0] : text);
  conversationText = parsed.message || '';
  voiceScript = parsed.voiceScript || parsed.message || '';
} catch (e) {
  conversationText = 'I understand your situation. Let us focus on what matters most right now, one step at a time.';
  voiceScript = conversationText;
}
return [{ json: { ...prev, conversationText, voiceScript } }];
`,
    },
  },
});

const assembleResponse = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Response Formatter', parameters: { mode: 'runOnceForAllItems', jsCode: assembleJs } },
});

const saveUserState = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Persist User State', parameters: { mode: 'runOnceForAllItems', jsCode: saveStateJs } },
});

const respondSuccess = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond Success',
    parameters: { respondWith: 'json', responseBody: expr('={{ $json }}') },
  },
});

const formatError = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Format Error', parameters: { mode: 'runOnceForAllItems', jsCode: errorJs } },
});

const respondError = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond Error',
    parameters: { respondWith: 'json', responseBody: expr('={{ $json }}'), options: { responseCode: 400 } },
  },
});

export default workflow('life-guardian-ai-api', 'LIFE GUARDIAN AI')
  .add(webhookTrigger)
  .to(normalizeRequest)
  .to(checkValid
    .onTrue(loadUserState
      .to(aiExtract)
      .to(validateExtraction)
      .to(riskEngine)
      .to(priorityEngine)
      .to(financialEngine)
      .to(actionFollowUp)
      .to(buildConvPrompt)
      .to(aiConversation)
      .to(parseConversation)
      .to(assembleResponse)
      .to(saveUserState)
      .to(respondSuccess))
    .onFalse(formatError.to(respondError)));
