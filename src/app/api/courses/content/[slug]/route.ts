import { NextResponse } from "next/server";
import { CourseService } from "@/lib/services/course.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

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
    const course = await CourseService.getCourseContent(slug);

    // Validar enrollment (a menos que sea ADMIN)
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    
    if (userRole !== "ADMIN") {
      const isEnrolled = await CourseService.isEnrolled(userId, course.id);
      if (!isEnrolled) {
        return NextResponse.json({ error: "No estás inscrito en este curso" }, { status: 403 });
      }
    }

    return NextResponse.json({ course });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
