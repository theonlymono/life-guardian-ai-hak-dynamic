import { workflow, node, trigger, ifElse, expr, newCredential } from '@n8n/workflow-sdk';

const normalizeJs = `
const raw = $input.first().json;
const body = raw.body || raw;
const userId = String(body.userId || '').trim();
const message = String(body.message || '').trim();
if (!userId) return [{ json: { valid: false, error: 'missing_userId', errorMessage: 'userId is required' } }];
if (!message) return [{ json: { valid: false, error: 'empty_message', errorMessage: 'message cannot be empty' } }];
return [{ json: { valid: true, userId, message, locale: body.locale || 'en-JP', currency: body.currency || 'JPY', inputMode: body.inputMode || 'text' } }];
`;

const loadStateJs = `
const input = $input.first().json;
const staticData = $getWorkflowStaticData('global');
if (!staticData.users) staticData.users = {};
const existing = staticData.users[input.userId] || { userId: input.userId, profile: {}, conversationContext: {} };
const extractionPrompt = \`Analyze this life planning message and extract structured facts ONLY from what is stated or clearly implied. Never invent numbers or facts.

User message: "\${input.message}"
Locale: \${input.locale}
Currency: \${input.currency}
Previous profile: \${JSON.stringify(existing.profile || {})}
Previous conversation context: \${JSON.stringify(existing.conversationContext || {})}

Return JSON with this exact structure and these exact key names:
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
- Every entry in lifeEvents MUST include a "type" chosen from the list above. Never omit it and never invent a new type.
- Use ONLY the userProfile key names listed above. Do not rename or add keys.
- dependents counts children and financially supported people. Do not count a non-working spouse; that is spouseWorking. Do not count an aging parent unless the user says they already support them.
- mortgage is the outstanding amount as a plain number when stated, otherwise null.
- A child starting university is child_university. A parent who may need care is aging_parent.
- Put unknown but important values in missingInformation and leave them null in userProfile.
- Detect intent from the message type. For what-if messages extract monthlyContribution when mentioned.
- Merge with previous context when the user provides follow-up numbers.\`;

return [{ json: { ...input, userState: existing, extractionPrompt } }];
`;

const pipelineJs = `
const prev = $('Load User State').first().json;
const aiRaw = $input.first().json;
let extraction = null;
let aiError = null;
try {
  const text = aiRaw.output || aiRaw.text || aiRaw.content?.parts?.[0]?.text || (typeof aiRaw === 'string' ? aiRaw : JSON.stringify(aiRaw));
  const match = typeof text === 'string' ? text.match(/\\{[\\s\\S]*\\}/) : null;
  extraction = JSON.parse(match ? match[0] : text);
} catch (e) {
  aiError = 'invalid_ai_json';
  extraction = { intent: 'new_life_event', lifeEvents: [{ type: 'general', confidence: 0.3 }], userProfile: {}, missingInformation: ['Please share more context'], whatIfParams: {} };
}
const profile = { ...(prev.userState.profile || {}), ...(extraction.userProfile || {}) };
Object.keys(profile).forEach(k => { if (profile[k] == null) delete profile[k]; });
const ctx = { ...(prev.userState.conversationContext || {}) };
const events = (extraction.lifeEvents || []).map(e => e.type);
const has = t => events.includes(t);
const risks = {};
const add = (cat, pts, reason, evidence) => {
  if (!risks[cat]) risks[cat] = { category: cat, score: 0, reasons: [], evidence: [] };
  risks[cat].score += pts; risks[cat].reasons.push(reason); risks[cat].evidence = [...new Set([...risks[cat].evidence, ...evidence])];
};
if (has('job_loss')) { add('finance', 35, 'Income disruption', ['job loss']); add('income_protection', 30, 'Income at risk', ['job loss']); }
if (has('job_loss') && (profile.dependents > 0)) { add('family', 25, 'Dependents affected', ['dependents']); add('income_protection', 25, 'Single income risk', ['dependents']); }
if (has('job_loss') && profile.mortgage) { add('housing', 30, 'Mortgage with income loss', ['mortgage']); }
if (has('child_university') || has('education_funding')) { add('education', 40, 'Education timeline', ['education']); }
if (has('aging_parent') || has('parent_care')) { add('caregiving', 35, 'Parent care', ['aging parent']); add('healthcare', 25, 'Healthcare planning', ['aging parent']); }
if (has('new_baby')) { add('family', 35, 'New dependent', ['new baby']); add('healthcare', 20, 'Healthcare needs', ['new baby']); }
if (has('retirement_planning')) { add('retirement', 35, 'Retirement planning', ['retirement']); }
if (profile.spouseWorking === false) { add('income_protection', 25, 'Single income household', ['single income']); add('family', 15, 'Family vulnerability', ['single income']); }
if (has('mortgage') || has('buying_house')) { add('housing', 20, 'Housing commitment', ['mortgage']); }
if (events.length === 0) add('finance', 10, 'General assessment', ['general']);
const level = s => s >= 70 ? 'CRITICAL' : s >= 50 ? 'HIGH' : s >= 30 ? 'MEDIUM' : 'LOW';
const riskMap = Object.values(risks).map(r => ({ category: r.category, level: level(r.score), score: Math.min(100, r.score), reason: r.reasons[0], evidence: r.evidence })).sort((a,b) => b.score - a.score);
const scoreRisk = cat => {
  const r = riskMap.find(x => x.category === cat); const base = r ? r.score : 0;
  let urgency = base/100, impact = base/100, timeSensitivity = 0.3, dependency = 0.3;
  if (cat === 'education') timeSensitivity = 0.9;
  if (cat === 'income_protection' && has('job_loss')) urgency = 0.9;
  if (cat === 'finance' && has('job_loss')) urgency = 0.95;
  return { category: cat, priorityScore: urgency*0.35 + impact*0.35 + timeSensitivity*0.2 + dependency*0.1 };
};
const priorities = [...new Set(riskMap.map(r => r.category))].map(scoreRisk).sort((a,b) => b.priorityScore - a.priorityScore).slice(0,3).map((s,i) => ({ rank: i+1, category: s.category, reason: 'Priority life risk area', priorityScore: Math.round(s.priorityScore*100) }));
// Simulations run only on figures the user actually gave us. Never fill a gap with a default amount.
let simulation = null;
const simulationBlockedBy = [];
const num = v => (typeof v === 'number' && isFinite(v) ? v : null);
const monthlyContrib = num(profile.monthlyContribution) ?? num(ctx.monthlyContribution) ?? num(extraction.whatIfParams?.monthlyContribution) ?? 0;
if (has('job_loss')) {
  const savings = num(profile.savings), expenses = num(profile.monthlyEssentialExpenses);
  if (savings !== null && expenses !== null && expenses > 0) {
    simulation = { scenario: 'cash_flow', savings, monthlyEssentialExpenses: expenses, emergencyRunwayMonths: Math.floor(savings / expenses), disclaimers: ['Estimates only'] };
  } else {
    if (savings === null) simulationBlockedBy.push('current savings');
    if (expenses === null) simulationBlockedBy.push('monthly essential expenses');
  }
}
if (has('child_university') || has('education_funding')) {
  const current = num(profile.educationSavings), target = num(profile.educationTarget), years = num(profile.yearsToUniversity);
  if (current !== null && target !== null && years !== null) {
    const projectedAmount = current + monthlyContrib*12*years;
    simulation = { scenario: 'education', currentSavings: current, target, years, monthlyContribution: monthlyContrib, projectedAmount, gap: Math.max(0, target - projectedAmount), disclaimers: ['Estimates only'] };
  } else {
    if (current === null) simulationBlockedBy.push('how much is already saved for education');
    if (target === null) simulationBlockedBy.push('your education savings target');
    if (years === null) simulationBlockedBy.push('years until university starts');
  }
}
if (has('retirement_planning')) {
  const age = num(profile.currentAge) ?? num(profile.age), ret = num(profile.retirementAge), current = num(profile.currentSavings) ?? num(profile.savings), target = num(profile.targetSavings);
  if (age !== null && ret !== null && current !== null && target !== null) {
    const years = Math.max(0, ret - age);
    simulation = { scenario: 'retirement', currentAge: age, retirementAge: ret, currentSavings: current, targetSavings: target, scenarios: [
      { name: 'Save 100K/month', monthlySaving: 100000, projectedSavings: current + 100000*12*years, gap: Math.max(0, target-(current+100000*12*years)) },
      { name: 'Save 150K/month', monthlySaving: 150000, projectedSavings: current + 150000*12*years, gap: Math.max(0, target-(current+150000*12*years)) },
      { name: 'Retire at 63', retirementAge: 63, projectedSavings: current + 100000*12*Math.max(0,63-age), gap: Math.max(0, target-(current+100000*12*Math.max(0,63-age))) }
    ], disclaimers: ['Estimates only'] };
  } else {
    if (age === null) simulationBlockedBy.push('your current age');
    if (ret === null) simulationBlockedBy.push('your planned retirement age');
    if (current === null) simulationBlockedBy.push('your current retirement savings');
    if (target === null) simulationBlockedBy.push('your retirement savings target');
  }
}
let followUp = { required: false, days: 30, reason: 'Check-in' }, protectionReview = null;
let next7 = ['Focus on top priority first'], next30 = ['Review progress in 30 days'], next3y = [];
if (has('job_loss')) { followUp = { required: true, days: 30, reason: 'Review after job loss', message: 'How is your financial situation?' }; next7 = ['Review emergency savings','List essential expenses','Estimate runway','Review protection']; protectionReview = { recommended: true, reason: 'Income stability review', category: 'income_protection' }; }
if (has('new_baby')) { followUp = { required: true, days: 90, reason: 'Family protection check', message: 'Review family protection plan' }; next7 = ['Review health coverage','Update emergency fund','Discuss leave impact']; }
if (has('child_university')) { followUp = { required: true, days: 30, reason: 'Education savings check', message: 'Revisit education target?' }; next7 = ['Confirm savings target','Calculate monthly need','Review timeline']; }
if (has('aging_parent')) { followUp = { required: true, days: 30, reason: 'Care planning check', message: 'Discussed care plan?' }; next7 = ['Discuss care preferences','Review parent health','Estimate care costs']; }
const actionPlan = { next7Days: next7, next30Days: next30, next3Years: next3y };
const conversationPrompt = 'User: ' + prev.message + '. Intent: ' + extraction.intent + '. Priorities: ' + JSON.stringify(priorities) + '. Risks: ' + JSON.stringify(riskMap) + '. Simulation: ' + JSON.stringify(simulation) + '. Write empathetic JSON response with message and voiceScript. Never state or imply any amount that is not in the data above. Say user does not need to solve everything today if multiple risks.';
return [{ json: { ...prev, extraction, profile, conversationContext: ctx, aiError, riskMap, priorities, simulation, simulationBlockedBy, actionPlan, followUp, protectionReview, conversationPrompt } }];
`;

const finalizeJs = `
const d = $('Life Guardian Pipeline').first().json;
const aiRaw = $input.first().json;
let message = '', voiceScript = '';
try {
  const text = aiRaw.output || aiRaw.text || aiRaw.content?.parts?.[0]?.text || (typeof aiRaw === 'string' ? aiRaw : JSON.stringify(aiRaw));
  const match = typeof text === 'string' ? text.match(/\\{[\\s\\S]*\\}/) : null;
  const parsed = JSON.parse(match ? match[0] : text);
  message = parsed.message || ''; voiceScript = parsed.voiceScript || message;
} catch (e) {
  message = 'You do not need to solve everything today. Let us start with your most time-sensitive priority.';
  voiceScript = message;
}
const missingInformation = [...new Set([...(d.extraction?.missingInformation || []), ...(d.simulationBlockedBy || [])])];
const response = {
  success: true,
  conversation: { message, tone: 'supportive', voiceScript },
  lifeEvents: (d.extraction?.lifeEvents || []).map(e => ({ type: e.type || 'general', confidence: e.confidence || 0.8, details: e.details || {} })),
  profile: d.profile || {},
  riskMap: d.riskMap || [],
  priorities: d.priorities || [],
  actionPlan: d.actionPlan || { next7Days: [], next30Days: [], next3Years: [] },
  simulation: d.simulation || null,
  missingInformation,
  followUp: d.followUp || null,
  protectionReview: d.protectionReview || null,
  conversationContext: d.conversationContext || {},
  intent: d.extraction?.intent || 'new_life_event',
  voice: { enabled: false, audioUrl: null, mimeType: null },
  meta: { locale: d.locale, currency: d.currency, inputMode: d.inputMode, aiError: d.aiError || null },
};
if (d.extraction?.intent === 'general_assessment') {
  response.assessmentQuestions = ['What is your biggest financial responsibility?', 'Any major life event in 3 years?', 'What is your biggest concern?'];
}
const staticData = $getWorkflowStaticData('global');
if (!staticData.users) staticData.users = {};
staticData.users[d.userId] = { userId: d.userId, profile: d.profile, activeRisks: d.riskMap, goals: d.priorities, conversationContext: d.conversationContext, lastInteraction: new Date().toISOString(), nextCheckIn: d.followUp?.required ? new Date(Date.now() + d.followUp.days*86400000).toISOString() : null };
return [{ json: response }];
`;

const errorJs = `
const d = $input.first().json;
return [{ json: { success: false, error: d.error, conversation: { message: d.errorMessage, tone: 'supportive' }, lifeEvents: [], profile: {}, riskMap: [], priorities: [], actionPlan: { next7Days: [], next30Days: [], next3Years: [] }, simulation: null, missingInformation: [], followUp: null, protectionReview: null } }];
`;

const webhookTrigger = trigger({ type: 'n8n-nodes-base.webhook', version: 2.1, config: { name: 'Life Guardian Webhook', parameters: { httpMethod: 'POST', path: 'life-guardian', responseMode: 'responseNode', options: { allowedOrigins: '*' } } } });
const normalizeRequest = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Normalize Request', parameters: { mode: 'runOnceForAllItems', jsCode: normalizeJs } } });
const checkValid = ifElse({ version: 2.2, config: { name: 'Valid Input?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.valid }}'), operator: { type: 'boolean', operation: 'true' }, rightValue: '' }], combinator: 'and' } } } });
const loadUserState = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Load User State', parameters: { mode: 'runOnceForAllItems', jsCode: loadStateJs } } });
const aiExtract = node({ type: '@n8n/n8n-nodes-langchain.googleGemini', version: 1.2, config: { name: 'AI Life Event Parser', parameters: { resource: 'text', operation: 'message', modelId: { __rl: true, mode: 'id', value: 'models/gemini-3.5-flash-lite' }, simplify: true, jsonOutput: true, messages: { values: [{ role: 'user', content: expr('{{ $json.extractionPrompt }}') }] }, builtInTools: { googleSearch: false, urlContext: false, codeExecution: false }, options: { temperature: 0.1, maxOutputTokens: 2000, systemMessage: 'Extract life events. Return valid JSON only. Never invent facts.' } }, credentials: { googlePalmApi: newCredential('Google Gemini') } } });
const pipeline = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Life Guardian Pipeline', parameters: { mode: 'runOnceForAllItems', jsCode: pipelineJs } } });
const aiConversation = node({ type: '@n8n/n8n-nodes-langchain.googleGemini', version: 1.2, config: { name: 'AI Conversation Generator', parameters: { resource: 'text', operation: 'message', modelId: { __rl: true, mode: 'id', value: 'models/gemini-3.5-flash-lite' }, simplify: true, jsonOutput: true, messages: { values: [{ role: 'user', content: expr('{{ $json.conversationPrompt }}') }] }, builtInTools: { googleSearch: false, urlContext: false, codeExecution: false }, options: { temperature: 0.4, maxOutputTokens: 800, systemMessage: 'You are LIFE GUARDIAN AI — warm life companion, not a salesperson. Return JSON: message, voiceScript.' } }, credentials: { googlePalmApi: newCredential('Google Gemini') } } });
const finalize = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Response Formatter', parameters: { mode: 'runOnceForAllItems', jsCode: finalizeJs } } });
const respondSuccess = node({ type: 'n8n-nodes-base.respondToWebhook', version: 1.5, config: { name: 'Respond Success', parameters: { respondWith: 'json', responseBody: expr('={{ $json }}') } } });
const formatError = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Format Error', parameters: { mode: 'runOnceForAllItems', jsCode: errorJs } } });
const respondError = node({ type: 'n8n-nodes-base.respondToWebhook', version: 1.5, config: { name: 'Respond Error', parameters: { respondWith: 'json', responseBody: expr('={{ $json }}'), options: { responseCode: 400 } } } });

export default workflow('life-guardian-ai-v2', 'LIFE GUARDIAN AI v2')
  .add(webhookTrigger)
  .to(normalizeRequest)
  .to(checkValid
    .onTrue(loadUserState.to(aiExtract).to(pipeline).to(aiConversation).to(finalize).to(respondSuccess))
    .onFalse(formatError.to(respondError)));
