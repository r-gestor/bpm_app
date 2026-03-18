import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { ExamService } from "@/lib/services/exam.service";
import { CourseService } from "@/lib/services/course.service";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await req.json();
    const studentId = (session.user as any).id;

    if (!courseId) throw new Error("courseId is required");

    // 1. Verificar si puede tomar el examen
    const canTake = await CourseService.canTakeExam(studentId, courseId);
    if (!canTake) {
      return NextResponse.json({ error: "Debes completar todos los videos antes de realizar el examen." }, { status: 403 });
    }

    // 2. Iniciar intento
    const examData = await ExamService.startAttempt(studentId, courseId);
    return NextResponse.json(examData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
