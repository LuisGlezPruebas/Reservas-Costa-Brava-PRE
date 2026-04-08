import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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
  } catch (error) {
    console.error('Error fetching admin:', error);
    return NextResponse.json(
      { error: 'Error al obtener admin' },
      { status: 500 }
    );
  }
}

// Made with Bob
