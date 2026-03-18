import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { StudentService } from "@/lib/services/student.service";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "BUYER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const buyerId = (session.user as any).id;
    
    await StudentService.enrollSelf(buyerId);

    return NextResponse.json({ 
      message: "Te has inscrito exitosamente como estudiante." 
    });
  } catch (error: any) {
    console.error("Error in self-enrollment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
