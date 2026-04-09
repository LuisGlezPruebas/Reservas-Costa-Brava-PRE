import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Allow public access to user data
    // This is needed for users to access their own reservation pages
    // Sensitive operations are protected in server actions
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        color: true,
        role: true,
        // Don't expose email to public
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}

// Made with Bob
