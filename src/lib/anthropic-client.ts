import { Anthropic } from '@anthropic-ai/sdk';

/**
 * Create a properly configured Anthropic client for OpenRouter
 * This ensures the API key and base URL are correctly set
 */
export const createAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.ANTHROPIC_BASE_URL;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  return new Anthropic({
    apiKey,
    baseURL: baseUrl || 'https://api.anthropic.com',
    defaultHeaders: {
      'anthropic-version': '2023-06-01',
    },
  });
};
