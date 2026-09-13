// config.js - centralize environment and request header handling for API keys

/**
 * Resolve API keys from request headers or environment variables.
 * Returns the raw keys and boolean flags indicating validity (>5 chars).
 */
export function resolveApiKeys(req) {
  // Header overrides allow per-request keys (useful for testing)
  const clientOpenAiKey = req?.headers?.['x-openai-api-key'] || req?.headers?.['x-api-key'];
  const clientGeminiKey = req?.headers?.['x-gemini-api-key'];

  // Detect placeholder values (e.g., from .env.example) and treat them as missing
  const isPlaceholder = (key) => {
    if (!key) return true;
    const lowered = key.toLowerCase();
    return lowered.includes('your_openai_api_key_here') || lowered.includes('your_gemini_api_key_here');
  };

  const openAiKeyRaw = (clientOpenAiKey || process.env.OPENAI_API_KEY || '').trim();
  const geminiKeyRaw = (clientGeminiKey || process.env.GEMINI_API_KEY || '').trim();

  const openAiKey = isPlaceholder(openAiKeyRaw) ? '' : openAiKeyRaw;
  const geminiKey = isPlaceholder(geminiKeyRaw) ? '' : geminiKeyRaw;

  const hasOpenAi = Boolean(openAiKey && openAiKey.length > 5);
  const hasGemini = Boolean(geminiKey && geminiKey.length > 5);

  if (!hasOpenAi && !hasGemini) {
    console.warn('⚠️ No valid API key detected. Ensure you replace placeholder values in .env with real keys.');
  }

  return { openAiKey, geminiKey, hasOpenAi, hasGemini };
}
