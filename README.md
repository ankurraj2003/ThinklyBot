# ThinklyBot 

The ThinklyBot is a high-performance, self-service Enterprise AI Consultant designed to turn operational friction into automated reality.

Think of it as a "CTO-in-a-box" for prospective clients. Instead of a generic chatbot, it acts as a strategic architect that audits a company’s manual processes—like lead scoring, inbox management, or data entry—and provides a professional-grade automation blueprint based on the Thinkly Labs methodology.

##  UI Screenshot


![ThinklyBot UI Screenshot](./public/Screenshot1.png)
![](./public/Screenshot2.png)


##  What It Does

- **Workflow Triage:** It asks the hard, clarifying questions a human consultant would (e.g., "What's your current CRM?" or "Where does the data drop off?").
- **Agent Blueprinting:** It generates technical stacks (using Gemini, LangGraph, and n8n) to show exactly how an AI agent would solve the user's problem.
- **Grounded Reasoning:** Using RAG (Retrieval-Augmented Generation), it exclusively quotes Thinkly Labs’ website, founder philosophies, and elite industry research (a16z/LangChain) to ensure zero hallucination.
- **Lead-Gen Engine:** It bridges the gap between "curiosity" and "conversion" by ending every audit with a calculated ROI and a direct link to book a demo with us.

## 🛠️ Tech Stack

- **Framework:** Next.js 16
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, Lucide React (Icons)
- **AI Integration:** Vercel AI SDK (`ai`), supporting models via Groq, OpenAI, and GitHub Models.
- **Database & Auth:** Supabase
- **Rendering:** `react-markdown` and `remark-gfm` for rich text.

##  Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Set up your `.env.local` file with your API keys (Groq, OpenAI, Supabase, etc.).

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
