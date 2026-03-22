import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

async function getModels() {
  const response = await fetch("https://api.groq.com/openai/v1/models", {
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    }
  });
  const data = await response.json();
  console.log(data.data.map(m => m.id).filter(id => id.includes('llama')));
}
getModels();
