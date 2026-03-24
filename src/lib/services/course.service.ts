import { supabase } from "@/lib/supabase";

/** Fisher-Yates shuffle — produce una permutación uniforme sin sesgo */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class CourseService {
  static async isEnrolled(studentId: string, courseId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id')
      .eq('studentId', studentId)
      .eq('courseId', courseId)
      .eq('status', 'ACTIVE')
      .maybeSingle();
    
    return !!data;
  }

  static async getCourseContent(slug: string) {
    const { data: product, error: pError } = await supabase
      .from('products')
      .select(`
        *,
        course:courses (
          *,
          videos:course_videos (*)
        )
      `)
      .eq('slug', slug)
      .single();

    if (pError || !product || !product.course) throw new Error("Curso no encontrado");
    
    // Si product.course viene como array (común en relaciones Supabase), tomamos el primero
    const courseData = Array.isArray(product.course) ? product.course[0] : product.course;
    
    if (!courseData) throw new Error("Datos del curso no encontrados");
    
    return courseData;
  }

  static async getStudentProgress(studentId: string, courseId: string) {
    const { data: progress, error } = await supabase
      .from('video_progress')
      .select('*')
      .eq('studentId', studentId)
      .eq('courseId', courseId);

    if (error) throw error;
    return progress;
  }

  static async saveVideoProgress(data: {
    studentId: string;
    courseId: string;
    videoId: string;
    watchedSeconds: number;
    completed: boolean;
  }) {
    const { data: progress, error } = await supabase
      .from('video_progress')
      .upsert({
        studentId: data.studentId,
        courseId: data.courseId,
        videoId: data.videoId,
        watchedSeconds: data.watchedSeconds,
        completed: data.completed,
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'studentId,videoId'
      })
      .select()
      .single();

    if (error) throw error;
    return progress;
  }

  static async canTakeExam(studentId: string, courseId: string) {
    // 1. Obtener videos del curso
    const { data: videos, error: vError } = await supabase
      .from('course_videos')
      .select('id')
      .eq('courseId', courseId);

    if (vError) throw vError;

    // 2. Obtener progreso completado
    const { data: completedProgress, error: pError } = await supabase
      .from('video_progress')
      .select('id')
      .eq('studentId', studentId)
      .eq('courseId', courseId)
      .eq('completed', true);

    if (pError) throw pError;

    return videos.length > 0 && videos.length === completedProgress.length;
  }

  static async getExamQuestions(courseId: string, count: number = 10) {
    if (!courseId) throw new Error("ID de curso no válido");

    // Incluimos isCorrect para poder validar integridad antes de servir la pregunta
    const { data: questions, error } = await supabase
      .from('questions')
      .select(`
        id,
        text,
        answers:answers (
          id,
          text,
          isCorrect
        )
      `)
      .eq('courseId', courseId);

    if (error) throw error;

    // Filtrar solo preguntas que tengan al menos 2 opciones Y exactamente 1 respuesta correcta.
    // Esto previene servir preguntas con datos incompletos o corruptos.
    const validQuestions = questions.filter(q => {
      const answers = q.answers || [];
      if (answers.length < 2) return false;
      const correctCount = answers.filter((a: any) => a.isCorrect === true).length;
      return correctCount === 1;
    });

    if (validQuestions.length === 0) {
      throw new Error("No hay preguntas válidas disponibles para este curso.");
    }

    // Fisher-Yates shuffle para selección uniforme sin sesgo
    const shuffled = shuffleArray(validQuestions);
    const selected = shuffled.slice(0, count);

    return selected.map(q => {
      // Orden determinista por ID — debe coincidir con submitExam
      const sortedAnswers = [...q.answers].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

      // Garantía: la respuesta correcta SIEMPRE está en las opciones
      const correctIdx = sortedAnswers.findIndex((a: any) => a.isCorrect === true);
      if (correctIdx === -1) {
        // Defensa extra — no debería llegar aquí por el filtro anterior
        throw new Error(`Pregunta ${q.id} no tiene respuesta correcta marcada.`);
      }

      return {
        id: q.id,
        question: q.text,
        // Solo enviamos texto al estudiante — nunca isCorrect
        options: sortedAnswers.map((a: any) => a.text)
      };
    });
  }

  static async submitExam(data: {
    studentId: string;
    courseId: string;
    answers: { questionId: string; selectedAnswer: number }[];
  }) {
    // 1. Fetch correct answers for comparison
    const questionIds = data.answers.map(a => a.questionId);
    const { data: allAnswers, error: qError } = await supabase
      .from('answers')
      .select('id, questionId, text, isCorrect')
      .in('questionId', questionIds);

    if (qError) throw qError;

    // 2. Calculate score and build per-question results
    let correctCount = 0;
    const questionResults = data.answers.map(userAns => {
      // Mismo orden determinista que getExamQuestions — comparación binaria, NO localeCompare
      const questionAnswers = allAnswers
        .filter(a => a.questionId === userAns.questionId)
        .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

      const selectedAnswer = questionAnswers[userAns.selectedAnswer];
      const correctAnswerIndex = questionAnswers.findIndex(a => a.isCorrect === true);
      const isCorrect = !!(selectedAnswer && selectedAnswer.isCorrect === true);
      if (isCorrect) correctCount++;

      return {
        questionId: userAns.questionId,
        selectedAnswerIndex: userAns.selectedAnswer,
        // Defensa: si no hay respuesta correcta, devolvemos -1 (el frontend lo maneja)
        correctAnswerIndex,
        isCorrect,
        // Enviamos el texto correcto para que el frontend pueda verificar visualmente
        correctAnswerText: correctAnswerIndex >= 0 ? questionAnswers[correctAnswerIndex].text : null
      };
    });

    const score = (correctCount / data.answers.length) * 100;
    const passed = score >= 80;

    // 3. Save attempt
    const { data: attempt, error: aError } = await supabase
      .from('exam_attempts')
      .insert({
        studentId: data.studentId,
        courseId: data.courseId,
        score: Math.round(score),
        passed,
        status: 'COMPLETED',
        completedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (aError) throw aError;

    let certificateId = null;
    if (passed) {
      try {
        // Find enrollment for the student and course
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('studentId', data.studentId)
          .eq('courseId', data.courseId)
          .single();

        if (enrollment) {
          const { CertificateService } = require("./certificate.service");
          const cert = await CertificateService.generateCertificate(data.studentId, enrollment.id);
          certificateId = cert.id;
        }
      } catch (certError) {
        console.error("Error generating certificate in submitExam:", certError);
        // We don't throw here to avoid failing the whole submission if only certificate fails
      }
    }

    return {
      attemptId: attempt.id,
      score,
      passed,
      correctCount,
      totalQuestions: data.answers.length,
      certificateId,
      questionResults
    };
  }

  static async getLatestPassedAttempt(studentId: string, courseId: string) {
    // 1. Get the latest passed attempt
    const { data: attempt, error: aError } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('studentId', studentId)
      .eq('courseId', courseId)
      .eq('passed', true)
      .order('completedAt', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (aError) throw aError;
    if (!attempt) return null;

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('studentId', studentId)
      .eq('courseId', courseId)
      .maybeSingle();

    let certificateId = null;

    if (enrollment) {
      // Try to FIND existing one
      const { data: cert, error: cError } = await supabase
        .from('certificates')
        .select('id, expiresAt')
        .eq('enrollmentId', enrollment.id)
        .maybeSingle();

      if (cert) {
        // Si el certificado está expirado, el estudiante debe volver a tomar el examen
        const isExpired = cert.expiresAt && new Date(cert.expiresAt) < new Date();
        if (isExpired) return null;
        certificateId = cert.id;
      } else if (!cError) {
        // PROACTIVE GENERATION: If no cert exists but they passed, generate it now
        try {
          const { CertificateService } = require("./certificate.service");
          const newCert = await CertificateService.generateCertificate(studentId, enrollment.id);
          certificateId = newCert.id;
        } catch (genError) {
          console.error("Error generating proactive certificate:", genError);
        }
      }
    }

    // Calculate metrics if missing based on score (assuming 10 questions as default if totalQuestions unknown)
    const score = Number(attempt.score);
    const totalQuestions = (attempt as any).totalQuestions || 10;
    const correctCount = (attempt as any).correctCount || Math.round((score / 100) * totalQuestions);

    return {
      ...attempt,
      correctCount,
      totalQuestions,
      certificateId
    };
  }
}
