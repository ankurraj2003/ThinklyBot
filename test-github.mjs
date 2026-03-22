import { generateText, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const githubModels = createOpenAI({
  baseURL: 'https://models.inference.ai.azure.com',
  apiKey: process.env.GITHUB_TOKEN,
  compatibility: 'compatible',
  fetch: async (url, options) => {
    console.log("OUTBOUND URL:", url);
    console.log("OPTIONS:", JSON.stringify(options, null, 2));
    const response = await fetch(url, options);
    console.log("RESPONSE STATUS:", response.status);
    return response;
  }
});

async function main() {
  try {
    console.log("Calling generateText...");
    const { text } = await generateText({
      model: githubModels('gpt-4o'),
      prompt: "Say hello",
    });
    console.log("Response:", text);
  } catch (error) {
    console.error("generateText ERROR:", error.message || error);
  }
}

main();
