import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  try {
    const { text } = await generateText({
      model: google("gemini-1.5-pro"),
      prompt: "Say hello",
    });
    console.log("SUCCESS:", text);
  } catch (error) {
    console.error("SDK ERROR:", error);
  }
}

main();
