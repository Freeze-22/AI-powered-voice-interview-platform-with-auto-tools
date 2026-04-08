const FALLBACK_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',  // Very reliable
  'google/gemma-3-27b-it:free',              // Google's reliable free model
  'deepseek/deepseek-chat-v3-0324:free',     // DeepSeek V3 (not R1)
  'qwen/qwen-2.5-72b-instruct:free',         // Qwen 2.5 72B
  'mistralai/mistral-7b-instruct:free',      // Mistral 7B
  'microsoft/phi-4-reasoning-plus:free',     // Microsoft Phi 4
];

const SYSTEM_PROMPTS = {
  INTERVIEWER: `You are an expert technical interviewer of a Voice Interview Platform. 
  Your goal is to conduct a professional, conversational, and realistic technical interview.
  
  RULES:
  1. Keep responses concise (1-3 sentences) as they will be spoken via TTS.
  2. Ask one question at a time.
  3. If the user needs to write code, say "Please write code for this in the editor" or simply "write code".
  4. If the user needs to draw, say "draw architecture" or "whiteboard this".
  5. Be encouraging but rigorous.
  6. If you are in MOCK MODE, maintain the persona perfectly.`
};

const TOOL_TYPES = {
  CODE_EDITOR: 'code_editor',
  WHITEBOARD: 'whiteboard'
};

module.exports = {
  FALLBACK_MODELS,
  SYSTEM_PROMPTS,
  TOOL_TYPES
};
