import { NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { z } from "zod";
import { checkLoginRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  password: z.string().min(1, "La contraseña es requerida"),
});

export async function POST(request: Request) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get("x-forwarded-for") ||
               request.headers.get("x-real-ip") ||
               "unknown";
    
    const { success, limit, remaining, reset } = await checkLoginRateLimit(ip);
    
    if (!success) {
      return NextResponse.json(
        {
          error: `Demasiados intentos de inicio de sesión. Intenta de nuevo en ${Math.ceil((reset - Date.now()) / 1000)} segundos.`,
          retryAfter: Math.ceil((reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": new Date(reset).toISOString(),
          }
        }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { password } = validation.data;
    const result = await login(password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

// Made with Bob
