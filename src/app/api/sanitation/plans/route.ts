import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { SanitationService } from "@/lib/services/sanitation.service";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const plans = await SanitationService.getUserPlans(userId);

    return NextResponse.json(plans);
  } catch (error: any) {
    console.error("Error fetching sanitation plans:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
