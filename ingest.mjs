import { embedMany } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const githubModels = createOpenAI({
  baseURL: 'https://models.inference.ai.azure.com',
  apiKey: process.env.GITHUB_TOKEN,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// We will read from a folder called "knowledge_base" by default
const KNOWLEDGE_DIR = join(__dirname, 'knowledge_base');

function chunkText(text, maxChunkSize = 1000) {
  // Simple paragraph-based chunking
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += para + '\n\n';
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) {
    return arrayOfFiles;
  }
  
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Only process text-readable files
      if (file.endsWith('.md') || file.endsWith('.txt') || file.endsWith('.csv') || file.endsWith('.json')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

async function main() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error(`❌ Error: Could not find folder at ${KNOWLEDGE_DIR}`);
    console.log(`👉 Please create a folder named "knowledge_base" in your project root and place your files inside it.`);
    return;
  }

  const files = getAllFiles(KNOWLEDGE_DIR);
  if (files.length === 0) {
    console.warn(`⚠️ No valid files (.md, .txt, .csv, .json) found in ${KNOWLEDGE_DIR}`);
    return;
  }

  console.log(`📚 Found ${files.length} file(s) in the knowledge base. Reading contents...`);

  const allChunks = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const chunks = chunkText(content);
    console.log(`   - Chunked ${file.split(/[\\/]/).pop()} into ${chunks.length} parts.`);
    allChunks.push(...chunks);
  }

  if (allChunks.length === 0) {
    console.warn('⚠️ No text chunks generated from the files.');
    return;
  }

  console.log(`\n🚀 Generating embeddings for ${allChunks.length} chunks using GitHub Models (text-embedding-3-small)...`);
  
  try {
    // Note: embedMany might have limits on array size, so we batch it if there are too many (e.g. > 100)
    const BATCH_SIZE = 50;
    
    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batchChunks = allChunks.slice(i, i + BATCH_SIZE);
      console.log(`   Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(allChunks.length/BATCH_SIZE)}...`);
      
      const { embeddings } = await embedMany({
        model: githubModels.embedding('text-embedding-3-small'),
        values: batchChunks,
      });

      const records = batchChunks.map((content, idx) => ({
        content,
        embedding: embeddings[idx],
      }));

      const { error } = await supabase.from('thinkly_knowledge').insert(records);

      if (error) {
        console.error('❌ Error inserting batch into Supabase:', error);
      } else {
        console.log(`   ✅ Successfully inserted ${records.length} records.`);
      }
    }

    console.log('\n🎉 Successfully ingested all knowledge base files into Supabase!');
    
  } catch (error) {
    console.error('\n❌ Ingestion failed:', error);
  }
}

main();
