export const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

// Validate environment variables
if (!env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set in environment variables');
}
