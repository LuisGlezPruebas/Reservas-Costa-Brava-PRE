import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export interface SessionData {
  userId: string;
  role: string;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
  cookieName: "reservas_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isLoggedIn === true;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session.isLoggedIn === true && session.role === "ADMIN";
}

export async function requireAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    throw new Error("No autenticado");
  }
}

export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error("Acceso denegado: se requieren permisos de administrador");
  }
}

export async function login(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get admin user from database
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!admin) {
      return { success: false, error: "Configuración incorrecta" };
    }

    // Compare password with environment variable
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error("ADMIN_PASSWORD not set in environment");
      return { success: false, error: "Configuración incorrecta" };
    }

    // Simple password comparison
    if (password !== adminPassword) {
      return { success: false, error: "Contraseña incorrecta" };
    }

    // Create session
    const session = await getSession();
    session.userId = admin.id;
    session.role = admin.role;
    session.isLoggedIn = true;
    await session.save();

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Error al iniciar sesión" };
  }
}

export async function logout() {
  const session = await getSession();
  session.destroy();
}

// Made with Bob
