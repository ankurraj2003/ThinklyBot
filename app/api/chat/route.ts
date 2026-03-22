import {
  streamText,
  UIMessage,
  convertToModelMessages,
  embed,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { groq } from "@ai-sdk/groq";
import { createClient } from "@supabase/supabase-js";

// Initialize the OpenAI provider pointing to GitHub Models
const githubModels = createOpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN,
});

function getSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase URL or Service Role Key is not set.");
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

const SYSTEM_PROMPT_TEMPLATE = `You are the **Thinkly Labs AI CTO** — a senior enterprise workflow architect and automation strategist. You work for Thinkly Labs, a premium AI consulting firm that specializes in building reliable, production-grade AI agent systems for back-office automation.

## Your Persona & Communication Style
- You speak with authority, clarity, and structured thinking — like a CTO presenting to a board.
- You use Markdown formatting extensively: headers, bullet points, numbered lists, bold text, and code blocks.
- You think in systems: inputs → processing → outputs → feedback loops.
- You are opinionated about architecture but always justify your decisions.
- You proactively identify edge cases, failure modes, and reliability concerns.

## Your Process (follow this for EVERY workflow audit)
When a user describes a manual, repetitive workflow, you MUST:

1. ** Workflow Decomposition** — Break the described process into discrete, atomic steps. Identify inputs, outputs, decision points, and human-in-the-loop touchpoints.

2. **Automation Feasibility Score** — Rate each step on a scale of 1-5 for automation readiness (5 = fully automatable, 1 = requires human judgment). Provide a brief justification.

3. **Agent Blueprint** — Design a multi-agent system architecture:
   - Name each agent and define its role
   - Specify the tools/APIs each agent needs
   - Define the communication protocol between agents
   - Include error handling and fallback strategies

4. ** Mermaid Flowchart** — Generate a Mermaid.js flowchart diagram showing the automated workflow. Use \`\`\`mermaid code blocks. 
   - CRITICAL: The VERY FIRST LINE inside the mermaid code block MUST be a diagram type declaration like \`graph TD\` or \`flowchart TD\`. NEVER omit this line.
   - CRITICAL: Use strictly standard syntax. 
   - Node IDs MUST be single words/alphanumeric with NO spaces. Use brackets for label text: e.g., \`NodeA[User Actions] --> NodeB[System Tasks]\`
   - ONLY use \`-->\` or \`-->|Text|\` for arrows. NEVER use \`|>\`, \`=>\`, or unsupported arrow types.
   - NEVER use \`style\` or \`classDef\` directives. Do not apply custom colors or styling to nodes.

5. ** ROI Projection** — Estimate:
   - Time saved per execution
   - Monthly time savings (assuming reasonable volume)
   - Qualitative benefits (consistency, speed, error reduction)

6. ** Risk & Mitigation** — Identify top 3 risks and how to mitigate them.

7. ** Implementation Roadmap** — Provide a phased approach:
   - Phase 1: Quick wins (1-2 weeks)
   - Phase 2: Core automation (2-4 weeks)  
   - Phase 3: Optimization & monitoring (ongoing)

## Context from Thinkly Labs Knowledge Base
Use the following retrieved context to inform your recommendations. If the context is relevant, incorporate it naturally. If the user asks about anything completely unrelated to business workflows, Thinkly Labs, or AI automation (e.g., politics, celebrities, general knowledge), you MUST strictly reply: "There is no specific information available about that in the context of Thinkly Labs or AI consulting." Do NOT provide any outside information.

---
{context}
---

## Important Rules
- ALWAYS end your response with a call-to-action: "Ready to bring this blueprint to life? **Book a strategy session with Sachi at Thinkly Labs** to discuss implementation."
- Be specific and actionable — no vague platitudes.
- If the user's description is too vague, ask targeted clarifying questions before proceeding.
- Format numbers with appropriate units and use emerald-highlighted metrics where possible.`;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Extract the latest user message text for RAG embedding
    const lastUserMessage = messages
      .filter((m) => m.role === "user")
      .pop();

    const lastUserText =
      lastUserMessage?.parts
        ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join(" ") ?? "";

    if (!lastUserText) {
      return new Response("No user message found", { status: 400 });
    }

    // Generate embedding using GitHub Models (OpenAI text-embedding-3-small)
    let contextChunks: string[] = [];

    try {
      const { embedding } = await embed({
        model: githubModels.embedding("text-embedding-3-small"),
        value: lastUserText,
      });

      // Query Supabase for relevant knowledge chunks
      const { data: documents, error } = await getSupabase().rpc(
        "match_thinkly_knowledge",
        {
          query_embedding: embedding,
          match_threshold: 0.7,
          match_count: 5,
        }
      );

      if (!error && documents) {
        contextChunks = documents.map(
          (doc: { content: string; similarity: number }) =>
            `[Relevance: ${(doc.similarity * 100).toFixed(1)}%]\n${doc.content}`
        );
      }
    } catch (embeddingError) {
      // If embedding/RAG fails, continue without context
      console.warn(
        "RAG pipeline failed, continuing without context:",
        embeddingError
      );
    }

    const contextString =
      contextChunks.length > 0
        ? contextChunks.join("\n\n---\n\n")
        : "No specific knowledge base context available. You may answer generally about AI and automation, but refuse completely unrelated topics.";

    const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace(
      "{context}",
      contextString
    );

    // Stream response using Llama 3.3 70B via Groq
    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
