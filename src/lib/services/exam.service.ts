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

export class ExamService {
  /**
   * Inicia un nuevo intento de examen seleccionando 10 preguntas aleatorias.
   */
  static async startAttempt(studentId: string, courseId: string) {
    // 1. Obtener todas las preguntas del curso con sus respuestas (incluye isCorrect para validar)
    const { data: questions, error: qError } = await supabase
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

    if (qError || !questions || !questions.length) throw new Error("No hay preguntas disponibles para este curso.");

    // Filtrar preguntas válidas: al menos 2 opciones y exactamente 1 respuesta correcta
    const validQuestions = questions.filter(q => {
      const answers = q.answers || [];
      if (answers.length < 2) return false;
      const correctCount = answers.filter((a: any) => a.isCorrect === true).length;
      return correctCount === 1;
    });

    if (validQuestions.length === 0) throw new Error("No hay preguntas válidas disponibles para este curso.");

    // 2. Fisher-Yates shuffle y seleccionar 10
    const shuffled = shuffleArray(validQuestions);
    const selectedQuestions = shuffled.slice(0, 10);

    // 3. Crear el intento en la DB
    const { data: attempt, error: aError } = await supabase
      .from('exam_attempts')
      .insert({
        studentId,
        courseId,
        score: 0,
        totalQuestions: selectedQuestions.length,
        correctAnswers: 0,
        passed: false,
        startedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (aError) throw aError;

    return {
      attemptId: attempt.id,
      questions: selectedQuestions.map(q => {
        // Orden determinista por ID — comparación binaria (NO localeCompare)
        const sortedAnswers = [...q.answers].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
        return {
          id: q.id,
          question: q.text,
          // Solo enviamos texto — nunca isCorrect al cliente
          options: sortedAnswers.map((a: any) => a.text)
        };
      })
    };
  }

  /**
   * Procesa las respuestas del estudiante y calcula el puntaje.
   */
  static async submitAttempt(studentId: string, attemptId: string, studentAnswers: { questionId: string, selectedAnswer: number }[]) {
    // 1. Obtener el intento para validar
    const { data: attempt, error: aError } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('studentId', studentId)
      .single();

    if (aError || !attempt) throw new Error("Intento no encontrado.");

    // 2. Obtener todas las respuestas para las preguntas enviadas
    const questionIds = studentAnswers.map(a => a.questionId);
    const { data: allAnswers, error: qError } = await supabase
      .from('answers')
      .select('id, questionId, text, isCorrect')
      .in('questionId', questionIds);

    if (qError) throw qError;

    // 3. Calcular puntaje — mismo orden determinista que startAttempt
    let correctCount = 0;
    studentAnswers.forEach(sa => {
      const questionAnswers = allAnswers
        .filter(a => a.questionId === sa.questionId)
        .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

      const selectedAnswer = questionAnswers[sa.selectedAnswer];
      if (selectedAnswer && selectedAnswer.isCorrect === true) {
        correctCount++;
      }
    });

    const totalQuestions = studentAnswers.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 80;

    // 4. Actualizar intento
    const { data: updatedAttempt, error: uError } = await supabase
      .from('exam_attempts')
      .update({
        score,
        correctAnswers: correctCount,
        passed,
        completedAt: new Date().toISOString()
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (uError) throw uError;

    // 5. Trigger certificado si aprobó
    if (passed) {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('studentId', studentId)
        .eq('courseId', attempt.courseId)
        .single();
      
      if (enrollment) {
        const { CertificateService } = require("./certificate.service");
        await CertificateService.generateCertificate(studentId, enrollment.id);
      }
    }

    return {
      score,
      passed,
      correctAnswers: correctCount,
      totalQuestions
    };
  }
}
