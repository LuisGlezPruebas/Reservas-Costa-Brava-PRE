import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuth, getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    await requireAuth();
    
    const { id } = await params;
    const session = await getSession();
    
    // Users can only access their own data, admins can access any
    if (session.role !== 'ADMIN' && session.userId !== id) {
      return NextResponse.json(
        { error: 'No tienes permiso para acceder a estos datos' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}

// Made with Bob
