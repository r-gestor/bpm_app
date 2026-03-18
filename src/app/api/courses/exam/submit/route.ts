import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { CourseService } from "@/lib/services/course.service";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, answers } = body;

    if (!courseId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const studentId = (session.user as any).id;
    
    const result = await CourseService.submitExam({
      studentId,
      courseId,
      answers
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Exam submission error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
