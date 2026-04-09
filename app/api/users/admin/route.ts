import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    // Verify admin authentication
    await requireAdmin();

    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(admin);
  } catch (error: any) {
    if (error.message === 'Acceso denegado: se requieren permisos de administrador' || 
        error.message === 'No autenticado') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    console.error('Error fetching admin:', error);
    return NextResponse.json(
      { error: 'Error al obtener admin' },
      { status: 500 }
    );
  }
}

// Made with Bob
