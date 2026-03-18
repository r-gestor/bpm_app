
import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from 'dotenv';
dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function run() {
  console.log("Checking API Key prefix:", process.env.ANTHROPIC_API_KEY?.substring(0, 10));
  try {
    // Some old SDKs didn't have a list method, but let's try
    // Official way now is via the models property if it exists
    if ((anthropic as any).models) {
       const models = await (anthropic as any).models.list();
       console.log("Available models:", JSON.stringify(models, null, 2));
    } else {
       console.log("SDK does not have .models.list()");
       // Try a simple message with a very old model
       const msg = await anthropic.messages.create({
         model: "claude-instant-1.2",
         max_tokens: 10,
         messages: [{ role: "user", content: "hi" }]
       });
       console.log("Success with claude-instant-1.2. Req ID:", msg.id);
    }
  } catch (err: any) {
    console.error("Test failed:", err.message);
    if (err.status) console.log("Status:", err.status);
    if (err.request_id) console.log("Req ID:", err.request_id);
  }
}

run();
