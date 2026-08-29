const fs = require('fs');
const path = require('path');

const wf = fs.readFileSync(path.join(__dirname, 'life-guardian-workflow.js'), 'utf8');

function extractConst(name) {
  const marker = `const ${name} = \``;
  const start = wf.indexOf(marker);
  if (start === -1) return '';
  let i = start + marker.length;
  while (i < wf.length) {
    if (wf[i] === '`' && wf[i - 1] !== '\\') {
      return wf.slice(start + marker.length, i);
    }
    i++;
  }
  return '';
}

const codes = {
  loadStateJs: extractConst('loadStateJs'),
  validateJs: extractConst('validateJs'),
  riskJs: extractConst('riskJs'),
  priorityJs: extractConst('priorityJs'),
  financialJs: extractConst('financialJs'),
  actionJs: extractConst('actionJs'),
  assembleJs: extractConst('assembleJs'),
  saveStateJs: extractConst('saveStateJs'),
  errorJs: extractConst('errorJs'),
};

const buildConvJs = `
const d = $input.first().json;
const prompt = 'Generate conversational response for LIFE GUARDIAN AI.\\n\\nUser message: ' + d.message + '\\nIntent: ' + (d.extraction?.intent || '') + '\\nTop priority: ' + JSON.stringify(d.priorities?.[0] || {}) + '\\nRisk map: ' + JSON.stringify(d.riskMap || []) + '\\nSimulation: ' + JSON.stringify(d.simulation || null) + '\\nAction plan: ' + JSON.stringify(d.actionPlan || {}) + '\\nMissing info: ' + JSON.stringify(d.extraction?.missingInformation || []);
return [{ json: { ...d, conversationPrompt: prompt } }];
`;

const parseConvJs = `
const prev = $('Build Conversation Prompt').first().json;
const aiRaw = $input.first().json;
let conversationText = '';
let voiceScript = '';
try {
  const text = aiRaw.output || aiRaw.text || JSON.stringify(aiRaw);
  const match = typeof text === 'string' ? text.match(/\\{[\\s\\S]*\\}/) : null;
  const parsed = JSON.parse(match ? match[0] : text);
  conversationText = parsed.message || '';
  voiceScript = parsed.voiceScript || parsed.message || '';
} catch (e) {
  conversationText = 'I understand your situation. Let us focus on what matters most right now, one step at a time.';
  voiceScript = conversationText;
}
return [{ json: { ...prev, conversationText, voiceScript } }];
`;

const extractSystem = 'You are LIFE GUARDIAN AI extraction engine. Extract ONLY facts stated in the user message. Never invent numbers. Return valid JSON only. Use null for unknown values and list gaps in missingInformation. Detect multiple simultaneous life events. Support intents: new_life_event, follow_up, what_if, general_assessment, provide_information.';

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

const ops = [
  { type: 'removeConnection', source: 'Normalize Request', target: 'Respond Success' },
  {
    type: 'addNode',
    node: {
      name: 'Valid Input?',
      type: 'n8n-nodes-base.if',
      typeVersion: 2.2,
      position: [448, 0],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
          conditions: [{ leftValue: '={{ $json.valid }}', operator: { type: 'boolean', operation: 'true' }, rightValue: '' }],
          combinator: 'and',
        },
      },
    },
  },
  {
    type: 'addNode',
    node: { name: 'Load User State', type: 'n8n-nodes-base.code', typeVersion: 2, position: [672, -120], parameters: { mode: 'runOnceForAllItems', jsCode: codes.loadStateJs } },
  },
  {
    type: 'addNode',
    node: {
      name: 'AI Life Event Parser',
      type: '@n8n/n8n-nodes-langchain.googleGemini',
      typeVersion: 1.2,
      position: [896, -120],
      parameters: {
        resource: 'text',
        operation: 'message',
        modelId: { __rl: true, mode: 'id', value: 'models/gemini-3.5-flash-lite' },
        simplify: true,
        jsonOutput: true,
        messages: { values: [{ role: 'user', content: '={{ $json.extractionPrompt }}' }] },
        builtInTools: { googleSearch: false, urlContext: false, codeExecution: false },
        options: { temperature: 0.1, maxOutputTokens: 2000, systemMessage: extractSystem },
      },
    },
  },
  { type: 'setNodeCredential', nodeName: 'AI Life Event Parser', credentialKey: 'googlePalmApi', credentialName: 'Google Gemini(PaLM) Api account' },
  { type: 'addNode', node: { name: 'Structured Validator', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1120, -120], parameters: { mode: 'runOnceForAllItems', jsCode: codes.validateJs } } },
  { type: 'addNode', node: { name: 'Deterministic Risk Engine', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1344, -120], parameters: { mode: 'runOnceForAllItems', jsCode: codes.riskJs } } },
  { type: 'addNode', node: { name: 'Priority Engine', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1568, -120], parameters: { mode: 'runOnceForAllItems', jsCode: codes.priorityJs } } },
  { type: 'addNode', node: { name: 'Financial What-If Engine', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1792, -120], parameters: { mode: 'runOnceForAllItems', jsCode: codes.financialJs } } },
  { type: 'addNode', node: { name: 'Action Plan & Follow-Up', type: 'n8n-nodes-base.code', typeVersion: 2, position: [2016, -120], parameters: { mode: 'runOnceForAllItems', jsCode: codes.actionJs } } },
  { type: 'addNode', node: { name: 'Build Conversation Prompt', type: 'n8n-nodes-base.code', typeVersion: 2, position: [2240, -120], parameters: { mode: 'runOnceForAllItems', jsCode: buildConvJs } } },
  {
    type: 'addNode',
    node: {
      name: 'AI Conversation Generator',
      type: '@n8n/n8n-nodes-langchain.googleGemini',
      typeVersion: 1.2,
      position: [2464, -120],
      parameters: {
        resource: 'text',
        operation: 'message',
        modelId: { __rl: true, mode: 'id', value: 'models/gemini-3.5-flash-lite' },
        simplify: true,
        jsonOutput: true,
        messages: { values: [{ role: 'user', content: '={{ $json.conversationPrompt }}' }] },
        builtInTools: { googleSearch: false, urlContext: false, codeExecution: false },
        options: { temperature: 0.4, maxOutputTokens: 800, systemMessage: conversationSystem },
      },
    },
  },
  { type: 'setNodeCredential', nodeName: 'AI Conversation Generator', credentialKey: 'googlePalmApi', credentialName: 'Google Gemini(PaLM) Api account' },
  { type: 'addNode', node: { name: 'Parse Conversation', type: 'n8n-nodes-base.code', typeVersion: 2, position: [2688, -120], parameters: { mode: 'runOnceForAllItems', jsCode: parseConvJs } } },
  { type: 'addNode', node: { name: 'Response Formatter', type: 'n8n-nodes-base.code', typeVersion: 2, position: [2912, -120], parameters: { mode: 'runOnceForAllItems', jsCode: codes.assembleJs } } },
  { type: 'addNode', node: { name: 'Persist User State', type: 'n8n-nodes-base.code', typeVersion: 2, position: [3136, -120], parameters: { mode: 'runOnceForAllItems', jsCode: codes.saveStateJs } } },
  { type: 'addNode', node: { name: 'Format Error', type: 'n8n-nodes-base.code', typeVersion: 2, position: [672, 120], parameters: { mode: 'runOnceForAllItems', jsCode: codes.errorJs } } },
  { type: 'addNode', node: { name: 'Respond Error', type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.5, position: [896, 120], parameters: { respondWith: 'json', responseBody: '={{ $json }}', options: { responseCode: 400 } } } },
  { type: 'setNodePosition', nodeName: 'Respond Success', position: [3360, -120] },
  { type: 'addConnection', source: 'Normalize Request', target: 'Valid Input?' },
  { type: 'addConnection', source: 'Valid Input?', target: 'Load User State', sourceIndex: 0 },
  { type: 'addConnection', source: 'Valid Input?', target: 'Format Error', sourceIndex: 1 },
  { type: 'addConnection', source: 'Load User State', target: 'AI Life Event Parser' },
  { type: 'addConnection', source: 'AI Life Event Parser', target: 'Structured Validator' },
  { type: 'addConnection', source: 'Structured Validator', target: 'Deterministic Risk Engine' },
  { type: 'addConnection', source: 'Deterministic Risk Engine', target: 'Priority Engine' },
  { type: 'addConnection', source: 'Priority Engine', target: 'Financial What-If Engine' },
  { type: 'addConnection', source: 'Financial What-If Engine', target: 'Action Plan & Follow-Up' },
  { type: 'addConnection', source: 'Action Plan & Follow-Up', target: 'Build Conversation Prompt' },
  { type: 'addConnection', source: 'Build Conversation Prompt', target: 'AI Conversation Generator' },
  { type: 'addConnection', source: 'AI Conversation Generator', target: 'Parse Conversation' },
  { type: 'addConnection', source: 'Parse Conversation', target: 'Response Formatter' },
  { type: 'addConnection', source: 'Response Formatter', target: 'Persist User State' },
  { type: 'addConnection', source: 'Persist User State', target: 'Respond Success' },
  { type: 'addConnection', source: 'Format Error', target: 'Respond Error' },
];

fs.writeFileSync(path.join(__dirname, 'update-ops.json'), JSON.stringify(ops));
console.log('Generated', ops.length, 'operations');
