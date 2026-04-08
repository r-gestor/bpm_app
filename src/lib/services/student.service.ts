import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

export const StudentService = {
  /**
   * Registers a new student under a buyer
   */
  async registerStudent(data: {
    buyerId: string;
    name: string;
    email: string;
    documentType: string;
    documentNumber: string;
    password?: string;
  }) {
    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", data.email)
      .maybeSingle();

    if (existingUser) {
      throw new Error("Este correo ya está en uso.");
    }

    // 2. If a password is provided, create an active account directly.
    // Otherwise fall back to the activation-link flow.
    const hasPassword = !!data.password;
    const activationToken = hasPassword ? null : uuidv4();
    const passwordHash = hasPassword
      ? await bcrypt.hash(data.password as string, 10)
      : "PENDING_ACTIVATION";

    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        email: data.email,
        name: data.name,
        role: "BUYER",
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        registeredBy: data.buyerId,
        activationToken,
        passwordHash,
        isActive: hasPassword ? true : false
      })
      .select()
      .single();

    if (createError) throw createError;

    // 4. Automatically enroll in the course associated with the buyer's purchase
    try {
      // Find a product purchased by the buyer that has an associated course
      const { data: payments } = await supabase
        .from("payments")
        .select("productId")
        .eq("buyerId", data.buyerId)
        .eq("status", "APPROVED")
        .limit(1);

      if (payments && payments.length > 0) {
        const { data: course } = await supabase
          .from("courses")
          .select("id")
          .eq("productId", payments[0].productId)
          .single();

        if (course) {
          await supabase
            .from("enrollments")
            .insert({
              buyerId: data.buyerId,
              studentId: newUser.id,
              courseId: course.id,
              status: "ACTIVE"
            });
        }
      }
    } catch (enrollError) {
      console.error("Error with automatic enrollment:", enrollError);
      // We don't fail registration if enrollment fails, but it's not ideal
    }

    return {
      user: newUser,
      activationLink: `${process.env.NEXTAUTH_URL}/activate?token=${activationToken}`
    };
  },

  /**
   * Gets all students registered by a specific buyer
   */
  async getStudentsByBuyer(buyerId: string) {
    // 1. Get all users registered by this buyer
    const { data: users, error: uError } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        documentType,
        documentNumber,
        isActive,
        activationToken,
        createdAt
      `)
      .eq("registeredBy", buyerId)
      .order("createdAt", { ascending: false });

    if (uError) throw uError;

    // 2. Fetch enrollments for these students to get course info
    const studentIds = users.map(u => u.id);
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select(`
        id,
        studentId,
        courseId,
        courses (
          id,
          totalLessons,
          course_videos (id)
        ),
        certificates (id)
      `)
      .in("studentId", studentIds)
      .eq("status", "ACTIVE");

    // 3. Fetch video progress for these students
    const { data: allProgress } = await supabase
      .from("video_progress")
      .select("studentId, courseId, videoId, completed")
      .in("studentId", studentIds)
      .eq("completed", true);

    // 4. Map everything together
    return users.map(user => {
      const enrollment = enrollments?.find(e => e.studentId === user.id);
      
      // Handle Supabase returning either an object or an array for single relationships
      const course = Array.isArray(enrollment?.courses) 
        ? enrollment.courses[0] 
        : (enrollment?.courses as any);
        
      const studentProgress = allProgress?.filter(p => 
        p.studentId === user.id && 
        p.courseId === enrollment?.courseId
      ) || [];
      
      // Use totalLessons from course, fallback to course_videos length or 0
      const totalVideos = course?.totalLessons || course?.course_videos?.length || 0;
      const completedVideos = studentProgress.length;
      
      const progressPercent = totalVideos > 0 
        ? Math.round((completedVideos / totalVideos) * 100) 
        : 0;

      // Cap at 100 if something goes wrong with counts
      const finalProgress = Math.min(progressPercent, 100);

      return {
        ...user,
        progressPercent: finalProgress,
        hasCertificate: (enrollment?.certificates as any[])?.length > 0,
        certificateId: (enrollment?.certificates as any[])?.[0]?.id || null,
        enrollmentId: enrollment?.id
      };
    });
  },

  /**
   * Gets the count of certified students for a buyer
   */
  async getCertifiedCount(buyerId: string) {
    const { count, error } = await supabase
      .from("certificates")
      .select("id, enrollments!inner(buyerId)", { count: 'exact', head: true })
      .eq("enrollments.buyerId", buyerId);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Activates a student account by setting a password
   */
  async activateAccount(token: string, passwordHash: string) {
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id")
      .eq("activationToken", token)
      .maybeSingle();

    if (findError || !user) {
      throw new Error("Token de activación inválido o expirado.");
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        passwordHash,
        activationToken: null,
        isActive: true
      })
      .eq("id", user.id);

    if (updateError) throw updateError;
    return true;
  },

  /**
   * Updates student information
   */
  async updateStudent(id: string, data: { name: string; documentType: string; documentNumber: string }) {
    const { error } = await supabase
      .from("users")
      .update({
        name: data.name,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        updatedAt: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  /**
   * Gets quota information for a buyer
   */
  async getQuotaInfo(buyerId: string) {
    try {
      // 0. Sync role just in case (e.g. manual DB updates)
      await this.syncUserRole(buyerId);

      // 1. Get total purchased slots (only course products, exclude sanitation plans)
      const { data: payments, error: pError } = await supabase
        .from("payments")
        .select("quantity, products!inner(slug)")
        .eq("buyerId", buyerId)
        .eq("status", "APPROVED")
        .neq("products.slug", "plan-saneamiento-iav");

      if (pError) {
        console.error("DEBUG: Error fetching payments quantity:", pError);
        throw pError;
      }

      const totalSlots = payments.reduce((acc, p) => acc + (p.quantity || 1), 0);

      // 2. Get used slots
      const { count: usedSlots, error: sError } = await supabase
        .from("users")
        .select("id", { count: 'exact', head: true })
        .eq("registeredBy", buyerId);

      if (sError) {
        console.error("DEBUG: Error fetching used slots count:", sError);
        throw sError;
      }

      return {
        totalSlots,
        usedSlots: usedSlots || 0,
        remainingSlots: Math.max(0, totalSlots - (usedSlots || 0))
      };
    } catch (err) {
      console.error("DEBUG: getQuotaInfo crashed:", err);
      throw err;
    }
  },

  /**
   * Enrolls the buyer themselves as a student
   */
  async enrollSelf(buyerId: string) {
    // 1. Check if already enrolled or registered as self
    const { data: user } = await supabase
      .from("users")
      .select("id, registeredBy, documentType, documentNumber")
      .eq("id", buyerId)
      .single();

    if (user?.registeredBy === buyerId) {
      throw new Error("Ya estás registrado como estudiante.");
    }

    // 2. Check quota
    const quota = await this.getQuotaInfo(buyerId);
    if (quota.remainingSlots <= 0) {
      throw new Error("No tienes cupos disponibles.");
    }

    // 3. Find a course to enroll in (from approved payments)
    const { data: payments } = await supabase
      .from("payments")
      .select("productId")
      .eq("buyerId", buyerId)
      .eq("status", "APPROVED")
      .limit(1);

    if (!payments || payments.length === 0) {
      throw new Error("No tienes cursos comprados para inscribirte.");
    }

    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("productId", payments[0].productId)
      .single();

    if (!course) {
      throw new Error("No se encontró el curso asociado a tu compra.");
    }

    // 4. Update user record to mark as "registered by self" (decrements quota)
    const { error: updateError } = await supabase
      .from("users")
      .update({ registeredBy: buyerId })
      .eq("id", buyerId);

    if (updateError) throw updateError;

    // 5. Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("enrollments")
      .insert({
        buyerId: buyerId,
        studentId: buyerId,
        courseId: course.id,
        status: "ACTIVE"
      })
      .select()
      .single();

    if (enrollError) throw enrollError;

    return enrollment;
  },

  /**
   * Robust sync for user roles based on payment status
   */
  async syncUserRole(userId: string) {
    // 1. Get user role
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (!user) return;

    // Check for approved payments
    const { data: payments } = await supabase
      .from("payments")
      .select("id")
      .eq("buyerId", userId)
      .eq("status", "APPROVED")
      .limit(1);

    if ((payments && payments.length > 0) || user.role === "STUDENT") {
      // Ensure role is BUYER if they have payments OR if they are still on legacy STUDENT role
      if (user.role !== "BUYER") {
        await supabase
          .from("users")
          .update({ role: "BUYER" })
          .eq("id", userId);
      }
    }
  }
};
