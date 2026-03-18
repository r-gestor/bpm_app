import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { redirect } from "next/navigation";
import { CourseService } from "@/lib/services/course.service";
import { supabase } from "@/lib/supabase";

export default async function CourseContentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;
  if (user.role === "ADMIN") {
    return <>{children}</>;
  }

  // We are hardcoding the check for manipulacion-alimentos as it's the only one for now
  const { data: product } = await supabase
    .from("products")
    .select("courses(id)")
    .eq("slug", "manipulacion-alimentos")
    .single();

  // Supabase relationships can be returned as arrays
  const courseId = Array.isArray(product?.courses) ? product?.courses[0]?.id : (product?.courses as any)?.id;

  if (courseId) {
    const isEnrolled = await CourseService.isEnrolled(user.id, courseId);
    if (!isEnrolled) {
      redirect("/dashboard?enroll_required=true");
    }
  }

  return <>{children}</>;
}
