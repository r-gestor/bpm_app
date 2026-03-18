import { z } from "zod";

export const sanitationFormSchema = z.object({
  businessName: z.string().min(2, "El nombre del negocio es requerido"),
  ownerName: z.string().min(2, "El nombre del representante legal es requerido"),
  businessType: z.string().min(2, "El tipo de negocio es requerido"),
  businessAddress: z.string().min(5, "La dirección es requerida"),
  businessPhone: z.string().optional(),
  businessEmail: z.string().email("Email inválido").optional(),
  employeeCount: z.number().min(1, "Debe tener al menos 1 empleado"),
  hasKitchen: z.boolean().default(false),
  hasDiningArea: z.boolean().default(false),
  hasStorage: z.boolean().default(false),
  hasRestrooms: z.boolean().default(false),
  foodTypes: z.array(z.string()).min(1, "Seleccione al menos un tipo de alimento"),
  specialRequirements: z.string().optional(),
  operatingHours: z.string().optional(),
  lastInspectionDate: z.string().optional(),
});

export type SanitationFormInput = z.infer<typeof sanitationFormSchema>;
