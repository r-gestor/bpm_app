import { supabase } from "@/lib/supabase";

export class ExamService {
  /**
   * Inicia un nuevo intento de examen seleccionando 10 preguntas aleatorias.
   */
  static async startAttempt(studentId: string, courseId: string) {
    // 1. Obtener todas las preguntas del curso con sus respuestas
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select(`
        id,
        text,
        answers:answers (
          id,
          text
        )
      `)
      .eq('courseId', courseId);

    if (qError || !questions || !questions.length) throw new Error("No hay preguntas disponibles para este curso.");

    // 2. Barajar y seleccionar 10
    const shuffled = questions.sort(() => 0.5 - Math.random());
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
        // Ordenamos las respuestas por ID para asegurar consistencia con el índice
        const sortedAnswers = [...q.answers].sort((a, b) => a.id.localeCompare(b.id));
        return {
          id: q.id,
          question: q.text,
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

    // 3. Calcular puntaje
    let correctCount = 0;
    studentAnswers.forEach(sa => {
      // Obtenemos las respuestas de ESTA pregunta y las ordenamos igual que al enviarlas
      const questionAnswers = allAnswers
        .filter(a => a.questionId === sa.questionId)
        .sort((a, b) => a.id.localeCompare(b.id));
      
      const selectedAnswer = questionAnswers[sa.selectedAnswer];
      if (selectedAnswer && selectedAnswer.isCorrect) {
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
