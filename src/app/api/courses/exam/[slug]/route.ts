import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { CourseService } from "@/lib/services/course.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const studentId = (session.user as any).id;
    
    // 1. Get course data
    const course = await CourseService.getCourseContent(slug);

    // 2. Check enrollment
    const isEnrolled = await CourseService.isEnrolled(studentId, course.id);
    if (!isEnrolled) {
      return NextResponse.json({ error: "No tienes una inscripción activa para este curso" }, { status: 403 });
    }
    
    // 3. Check if already passed
    const passedAttempt = await CourseService.getLatestPassedAttempt(studentId, course.id);
    
    if (passedAttempt) {
      return NextResponse.json({ 
        course, 
        alreadyPassed: true, 
        result: {
          score: Math.round(Number(passedAttempt.score)),
          passed: true,
          correctCount: passedAttempt.correctCount,
          totalQuestions: passedAttempt.totalQuestions,
          certificateId: passedAttempt.certificateId
        }
      });
    }

    // 3. Get 10 random questions
    const questions = await CourseService.getExamQuestions(course.id, 10);
    
    return NextResponse.json({ course, questions, alreadyPassed: false });
  } catch (error: any) {
    console.error("Exam API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
