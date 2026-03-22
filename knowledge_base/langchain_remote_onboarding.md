Source: LangChain Case Studies
Title: How Remote uses LangChain and LangGraph to onboard thousands of customers with AI

Topic: Data Migration, HR Automation, Schema Mapping

URL Source: https://blog.langchain.com/customers-remote/

Published Time: 2026-01-19T16:00:07.000Z

Markdown Content:
_Guest post written by José Mussa (Staff Software Engineer @ Remote)_

[Remote](https://remote.com/?ref=blog.langchain.com) is a fast-growing startup helping companies hire, manage, and pay employees globally from a single platform. Remote’s customers operate across many countries and regulatory environments, and they trust Remote as the system of record for their employee, payroll, and compliance data. Every new customer arrives with a unique set of HR and payroll data , with sometimes thousands of spreadsheets or large SQL exports. Migrating that data accurately and quickly is make-or-break for onboarding, but doing it manually simply doesn’t scale.

To solve this challenge, Remote built a Code Execution Agent inside its AI Service to automate these migrations. This agent brings together the reasoning power of large language models with the precision of deterministic code execution. Here's how it works, why Remote chose LangChain and LangGraph to build it, and what they learned along the way.

## The Challenge: Context windows and hallucinations

LLMs are powerful, but they have hard limits. Every model has a context window: the maximum number of tokens it can process at once. Even state‑of‑the‑art models like GPT‑5 cap out around 400k tokens, far less than the millions of characters in a large payroll spreadsheet. Models also need part of that window to track instructions, system prompts, and conversation history.

Trying to feed a 50 MB Excel file directly into an LLM isn’t just expensive; it’s likely to produce hallucinations. As Anthropic engineers have pointed out, when agents call tools directly, every intermediate result flows through the model, which can add tens of thousands of tokens per call and even exceed the context limit.

For a global employment platform like Remote, where accuracy and compliance are non-negotiable, these constraints made it clear that a different approach to large-scale data migrations was necessary.

## The Solution: Let the models reason, let code execute

Remote’s Code Execution Agent separates the “thinking” from the “doing.” Instead of forcing the LLM to ingest all the data, it uses LangChain’s tool‑calling interface to decide what steps to take, then writes and runs real Python code to transform the data.

Anthropic's research on code execution shows why this hybrid design works: by letting agents run code in a sandbox, tool definitions and intermediate results stay outside the context window. Only instructions and summaries pass through the model, dramatically cutting token usage and virtually eliminating hallucination risk.

Here's how Remote’s agent works in practice:

*   File ingestion. Customers upload their raw data (CSV, Excel or SQL exports) to Remote’s secure storage.
*   Agent reasoning. Using LangChain’s tool‑calling, the agent receives a task like “Convert this file into Remote’s employee onboarding schema.” It maps out how to translate the input columns into the schema.
*   Sandboxed execution. Behind the scenes, a Python sandbox (running in WebAssembly) executes the LLM‑generated code. Remote leans on libraries like Pandas because they're fast and flexible for data analysis.
*   Iterative refinement. The agent reviews the output, writes more code if needed, and repeats until the data meets the schema.
*   Structured output. The final, validated JSON file is stored for ingestion. Large intermediate results never pass back to the model, keeping the context small.

This architecture started as a proof of concept where Remote fed a 5,000-row Excel file into the agent. The agent loaded the file in the sandbox, mapped each entry to the schema using Pandas, and could answer queries like "What is the age of employee X?" by running code instead of generating text. Remote also limits console output so the model doesn't try to read entire datasets – a simple "show the first N rows" pattern borrowed straight from data science notebooks.

## Why LangChain and LangGraph

Remote chose LangChain because its ecosystem offers mature abstractions for prompt handling and tool invocation. Its modular design allowed the team to integrate multiple model providers and build on a standard interface instead of rolling out their own. The Remote AI Agent Toolkit (the open‑source package Remote publishes for partners) already uses LangChain to expose HR tasks as structured tools, so keeping the internal workflows consistent was a natural fit. LangChain gave Remote the foundation to focus on what matters most for them: safety, scalability, and developer experience.

Its node-and-edge model lets Remote represent complex workflows— ingestion, mapping, execution, validation— as a directed graph. Each step becomes a node with explicit transitions for success, failure, or retry. This makes the agent's state transparent and recoverable, similar to how distributed systems engineers reason about pipelines. LangGraph's focus on long-running, stateful agents was a perfect match for our multi-step migration process.

## Results and impact

By combining LLM reasoning with deterministic code execution, Remote has turned a manual process into an automated workflow. Their onboarding teams no longer write custom scripts for each customer – they simply plug data into the Code Execution Agent. The agent transforms diverse formats into a consistent JSON schema in hours instead of days.

Beyond speed, the system has made everything more reliable. Because the transformation logic runs as code in a sandbox, it's repeatable and auditable, which is critical for a platform handling sensitive employment and payroll data across jurisdictions. The LLM guides the process, but the actual data manipulation happens with trusted Python libraries, completely sidestepping hallucination issues.

## Lessons learned

Building this AI agent taught Remote several lessons that now inform how its team builds AI systems across the company:

*   LLMs are planners, not processors. Use them to reason about tasks and choose tools, but offload heavy data processing to code.
*   Structure beats improvisation. Orchestrating workflows as graphs makes them much easier to debug and extend.
*   Context tokens are precious. Large intermediate results should stay in the execution environment where they belong.
*   Python remains the analytics workhorse. Libraries like Pandas offer fast, flexible data manipulation that's hard to beat.

## What’s next

The Code Execution Agent is one building block in Remote’s broader AI platform. Whenever they spot a repetitive pattern across teams, like converting documents into structured records or extracting data from semi-structured forms, they abstract it into a reusable agent. A recent example is an Agentic OCR-to-JSON Schema prototype, which combines document parsing with an agentic workflow to outperform basic OCR by a wide margin.

As Remote refines these tools, the team is planning to contribute generic improvements back to LangChain's open-source ecosystem and adopt new community innovations as they emerge.

## Final thoughts

Migrating HR data is one of the toughest parts of onboarding thousands of customers in a global employment platform. By pairing LangChain’s tool framework with LangGraph’s orchestration and a Python code‑execution layer, Remote built a system that handles complex transformations reliably and at scale. This hybrid approach of using LLMs for reasoning and code for execution reflects how Remote invests in AI as infrastructure: removing friction while enabling teams to focus on higher-level problems that help customers employ and pay anyone, anywhere.

### Join our newsletter

Updates from the LangChain team and community

Enter your email

Processing your application...

Success! Please check your inbox and click the link to confirm your subscription.

Sorry, something went wrong. Please try again.