import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;
    const studentId = (session.user as any).id;

    // 1. Find the course by slug
    const { data: product } = await supabase
      .from('products')
      .select('course:courses(id)')
      .eq('slug', slug)
      .single();

    const courseId = (product?.course as any)?.id;
    if (!courseId) return NextResponse.json({ certificateId: null });

    // 2. Check for certificate through CourseService (which is proactive)
    const { CourseService } = require("@/lib/services/course.service");
    const passedAttempt = await CourseService.getLatestPassedAttempt(studentId, courseId);

    return NextResponse.json({ certificateId: passedAttempt?.certificateId || null });
  } catch (error: any) {
    console.error("Error checking certificate:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
