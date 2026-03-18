import { NextResponse } from "next/server";
import { SanitationService } from "@/lib/services/sanitation.service";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessData = await req.json();
    const ownerId = (session.user as any).id;

    if (!businessData.businessName || !businessData.establishmentType) {
      return NextResponse.json({ error: "businessName and establishmentType are required" }, { status: 400 });
    }

    const plan = await SanitationService.generatePlan(businessData, ownerId);
    return NextResponse.json(plan);
  } catch (error: any) {
    console.error("Sanitation Generate Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
