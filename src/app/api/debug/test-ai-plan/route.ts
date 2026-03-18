
import { NextResponse } from "next/server";
import { AiPlanService } from "@/lib/services/ai-plan.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const planId = searchParams.get("planId") || "71cd7624-30f7-47b0-8d0b-f595843c6e72";
  
  console.log(`[Debug API] Triggering generation for plan ${planId}`);
  const apiKey = process.env.ANTHROPIC_API_KEY || "";
  
  if (searchParams.get("checkEnv")) {
    return NextResponse.json({ 
      exists: !!process.env.ANTHROPIC_API_KEY,
      length: apiKey.length,
      prefix: apiKey.substring(0, 15),
      raw: apiKey // Be careful, but this is a debug route we created
    });
  }
  
  if (searchParams.get("testFetch")) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 10,
          system: "You are a helpful assistant.",
          messages: [{ role: "user", content: "hi" }]
        })
      });
      const data = await response.json();
      return NextResponse.json({ fetchResult: data });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  if (searchParams.get("listModels")) {
    try {
      const anthropic = (AiPlanService as any).anthropic || (await import("@/lib/services/ai-plan.service")).AiPlanService;
      // We need access to the anthropic instance. Let's make it public or just create one.
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const models = await (client as any).models?.list() || "Models.list not found in SDK";
      return NextResponse.json({ models });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  const action = searchParams.get("action") || searchParams.get("phase") || "content";

  try {
    if (action === "content") {
      const result = await AiPlanService.generateContent(planId);
      return NextResponse.json(result);
    } else if (action === "pdf") {
      const result = await AiPlanService.generatePdf(planId);
      return NextResponse.json(result);
    } else if (action === "full") {
      const result = await AiPlanService.generateFullPlan(planId);
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: "Invalid action/phase" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("[Debug API] Error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message, 
      stack: err.stack,
      planId 
    }, { status: 500 });
  }
}
