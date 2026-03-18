import { NextResponse } from "next/server";
import { ExamService } from "@/lib/services/exam.service";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId, answers } = await req.json();
    const studentId = (session.user as any).id;

    if (!attemptId || !answers) throw new Error("attemptId and answers are required");

    const result = await ExamService.submitAttempt(studentId, attemptId, answers);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
