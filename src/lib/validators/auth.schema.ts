import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const enrollStudentSchema = z.object({
  studentEmail: z.string().email("Email del estudiante inválido"),
  studentName: z.string().min(2, "El nombre del estudiante es requerido"),
  courseId: z.string().min(1, "El curso es requerido"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
