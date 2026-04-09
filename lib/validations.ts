import { z } from "zod";

// Reservation validation schemas
export const createReservationSchema = z.object({
  userId: z.string().cuid("ID de usuario inválido"),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  guests: z.number().int().min(1, "Debe haber al menos 1 huésped").max(10, "Máximo 10 huéspedes"),
  notes: z.string().max(500, "Las notas no pueden exceder 500 caracteres").optional(),
});

export const updateReservationSchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  guests: z.number().int().min(1, "Debe haber al menos 1 huésped").max(10, "Máximo 10 huéspedes"),
  notes: z.string().max(500, "Las notas no pueden exceder 500 caracteres").optional(),
});

export const reservationIdSchema = z.string().cuid("ID de reserva inválido");

export const adminActionSchema = z.object({
  id: z.string().cuid("ID de reserva inválido"),
  adminId: z.string().cuid("ID de admin inválido"),
  adminComment: z.string().max(500, "El comentario no puede exceder 500 caracteres").optional(),
});

// User validation schemas
export const userIdSchema = z.string().cuid("ID de usuario inválido");

// Date range validation
export const dateRangeSchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  excludeId: z.string().cuid().optional(),
});

// Calendar validation
export const calendarParamsSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(0).max(11),
});

// Login validation
export const loginSchema = z.object({
  password: z.string().min(1, "La contraseña es requerida"),
});

// Helper function to validate and return errors
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0].message,
    };
  }
  
  return {
    success: true,
    data: result.data,
  };
}

// Made with Bob
