'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { doRangesOverlap } from '@/lib/utils';
import { sendNewRequestEmail, sendApprovedEmail, sendRejectedEmail } from '@/lib/email';
import { createReservationSchema, updateReservationSchema, reservationIdSchema, adminActionSchema, validateData } from '@/lib/validations';
import { requireAdmin } from '@/lib/auth';

const MAX_GUESTS = 10;

// Helper function to calculate maximum guests per day in a date range
function getMaxGuestsPerDay(
  checkIn: Date,
  checkOut: Date,
  overlappingReservations: Array<{checkIn: Date, checkOut: Date, guests: number}>
): number {
  let maxGuests = 0;
  
  // Iterate through each day in the requested range
  const currentDate = new Date(checkIn);
  while (currentDate <= checkOut) {
    // Count guests on this specific day
    const guestsOnThisDay = overlappingReservations
      .filter(res => {
        return currentDate >= res.checkIn && currentDate <= res.checkOut;
      })
      .reduce((sum, res) => sum + res.guests, 0);
    
    maxGuests = Math.max(maxGuests, guestsOnThisDay);
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return maxGuests;
}

export async function createReservation(data: {
  userId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  notes?: string;
}) {
  try {
    // Validate input data
    const validation = validateData(createReservationSchema, data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const validatedData = validation.data;
    // Validate dates
    const checkIn = new Date(validatedData.checkIn);
    const checkOut = new Date(validatedData.checkOut);

    if (checkOut <= checkIn) {
      return {
        success: false,
        error: 'La fecha de salida debe ser posterior a la fecha de entrada',
      };
    }

    // Check for overlapping approved reservations
    const overlappingReservations = await prisma.reservation.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          {
            AND: [
              { checkIn: { lt: checkOut } },
              { checkOut: { gt: checkIn } },
            ],
          },
        ],
      },
    });

    // Calculate maximum guests per day in overlapping reservations
    const maxGuestsPerDay = getMaxGuestsPerDay(checkIn, checkOut, overlappingReservations);

    // Check if adding this reservation would exceed max capacity
    if (maxGuestsPerDay + data.guests > MAX_GUESTS) {
      const availableCapacity = MAX_GUESTS - maxGuestsPerDay;
      if (availableCapacity === 0) {
        return {
          success: false,
          error: 'Estas fechas están completamente ocupadas (10 personas)',
        };
      }
      return {
        success: false,
        error: `Solo hay capacidad para ${availableCapacity} ${availableCapacity === 1 ? 'persona' : 'personas'} en estas fechas`,
      };
    }

    // Check for overlapping pending reservations
    const overlappingPending = await prisma.reservation.findMany({
      where: {
        status: 'PENDING',
        OR: [
          {
            AND: [
              { checkIn: { lt: checkOut } },
              { checkOut: { gt: checkIn } },
            ],
          },
        ],
      },
    });

    const maxPendingGuestsPerDay = getMaxGuestsPerDay(checkIn, checkOut, overlappingPending);

    if (maxGuestsPerDay + maxPendingGuestsPerDay + data.guests > MAX_GUESTS) {
      const availableCapacity = MAX_GUESTS - maxGuestsPerDay - maxPendingGuestsPerDay;
      return {
        success: false,
        error: `Solo hay capacidad para ${availableCapacity} ${availableCapacity === 1 ? 'persona' : 'personas'} en estas fechas (hay solicitudes pendientes)`,
      };
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        userId: validatedData.userId,
        checkIn,
        checkOut,
        guests: validatedData.guests,
        notes: validatedData.notes,
        status: 'PENDING',
      },
      include: {
        user: true,
      },
    });

    // Send email notification to admin (non-blocking)
    sendNewRequestEmail({
      id: reservation.id,
      user: {
        name: reservation.user.name,
        email: reservation.user.email,
      },
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      guests: reservation.guests,
      notes: reservation.notes,
      createdAt: reservation.createdAt,
    }).catch((error) => {
      console.error('Failed to send new request email, but reservation was created:', error);
    });

    revalidatePath('/user/[id]');
    revalidatePath('/admin');

    return {
      success: true,
      reservation,
    };
  } catch (error) {
    console.error('Error creating reservation:', error);
    return {
      success: false,
      error: 'Error al crear la reserva',
    };
  }
}

export async function updateReservation(
  id: string,
  data: {
    checkIn: string;
    checkOut: string;
    guests: number;
    notes?: string;
  }
) {
  try {
    // Parse dates correctly to avoid timezone issues
    const [checkInYear, checkInMonth, checkInDay] = data.checkIn.split('-').map(Number);
    const [checkOutYear, checkOutMonth, checkOutDay] = data.checkOut.split('-').map(Number);
    
    const checkIn = new Date(checkInYear, checkInMonth - 1, checkInDay);
    const checkOut = new Date(checkOutYear, checkOutMonth - 1, checkOutDay);

    if (checkOut <= checkIn) {
      return {
        success: false,
        error: 'La fecha de salida debe ser posterior a la fecha de entrada',
      };
    }

    // Get current reservation
    const currentReservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!currentReservation) {
      return {
        success: false,
        error: 'Reserva no encontrada',
      };
    }

    // Can only edit PENDING or APPROVED reservations
    if (!['PENDING', 'APPROVED'].includes(currentReservation.status)) {
      return {
        success: false,
        error: 'No se puede editar esta reserva',
      };
    }

    // Check if dates have changed
    const datesChanged =
      checkIn.getTime() !== currentReservation.checkIn.getTime() ||
      checkOut.getTime() !== currentReservation.checkOut.getTime();

    // If APPROVED reservation tries to change dates, reject the edit
    if (currentReservation.status === 'APPROVED' && datesChanged) {
      return {
        success: false,
        error: 'No se pueden cambiar las fechas de una reserva aprobada. Debes rechazar esta reserva y crear una nueva.',
      };
    }

    // Check for overlapping reservations (excluding current one)
    const overlappingReservations = await prisma.reservation.findMany({
      where: {
        id: { not: id },
        status: { in: ['APPROVED', 'PENDING'] },
        OR: [
          {
            AND: [
              { checkIn: { lt: checkOut } },
              { checkOut: { gt: checkIn } },
            ],
          },
        ],
      },
    });

    // Calculate maximum guests per day in overlapping reservations
    const maxGuestsPerDay = getMaxGuestsPerDay(checkIn, checkOut, overlappingReservations);

    if (maxGuestsPerDay + data.guests > MAX_GUESTS) {
      const availableCapacity = MAX_GUESTS - maxGuestsPerDay;
      return {
        success: false,
        error: `Solo hay capacidad para ${availableCapacity} ${availableCapacity === 1 ? 'persona' : 'personas'} en estas fechas`,
      };
    }

    // Prepare update data
    const updateData: any = {
      checkIn,
      checkOut,
      guests: data.guests,
      notes: data.notes,
    };

    // If editing a PENDING reservation and dates changed, keep it PENDING
    // If editing an APPROVED reservation and only guests/notes changed, keep it APPROVED
    // (dates change is already blocked above for APPROVED reservations)

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/user/[id]');
    revalidatePath('/admin');

    return {
      success: true,
      reservation,
      wasApproved: currentReservation.status === 'APPROVED',
    };
  } catch (error) {
    console.error('Error updating reservation:', error);
    return {
      success: false,
      error: 'Error al actualizar la reserva',
    };
  }
}

export async function cancelReservation(id: string) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return {
        success: false,
        error: 'Reserva no encontrada',
      };
    }

    // Can cancel PENDING or APPROVED reservations
    if (!['PENDING', 'APPROVED'].includes(reservation.status)) {
      return {
        success: false,
        error: 'No se puede cancelar esta reserva',
      };
    }

    await prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    revalidatePath('/user/[id]');
    revalidatePath('/admin');

    return {
      success: true,
      wasApproved: reservation.status === 'APPROVED',
    };
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return {
      success: false,
      error: 'Error al cancelar la reserva',
    };
  }
}

export async function approveReservation(id: string, adminId: string, adminComment?: string) {
  try {
    // Check admin authorization
    await requireAdmin();

    // Validate input
    const validation = validateData(adminActionSchema, { id, adminId, adminComment });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const { id: validId, adminId: validAdminId, adminComment: validComment } = validation.data;

    const reservation = await prisma.reservation.findUnique({
      where: { id: validId },
    });

    if (!reservation) {
      return {
        success: false,
        error: 'Reserva no encontrada',
      };
    }

    if (reservation.status !== 'PENDING') {
      return {
        success: false,
        error: 'Solo se pueden aprobar solicitudes pendientes',
      };
    }

    // Check for overlapping approved reservations
    const overlappingReservations = await prisma.reservation.findMany({
      where: {
        id: { not: id },
        status: 'APPROVED',
        OR: [
          {
            AND: [
              { checkIn: { lt: reservation.checkOut } },
              { checkOut: { gt: reservation.checkIn } },
            ],
          },
        ],
      },
    });

    // Calculate maximum guests per day in overlapping reservations
    const maxGuestsPerDay = getMaxGuestsPerDay(
      reservation.checkIn,
      reservation.checkOut,
      overlappingReservations
    );

    if (maxGuestsPerDay + reservation.guests > MAX_GUESTS) {
      const availableCapacity = MAX_GUESTS - maxGuestsPerDay;
      return {
        success: false,
        error: `No se puede aprobar: solo hay capacidad para ${availableCapacity} ${availableCapacity === 1 ? 'persona' : 'personas'} en estas fechas`,
      };
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id: validId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: validAdminId,
        adminComment: validComment || null,
      },
      include: {
        user: true,
      },
    });

    // Send email notification to user (non-blocking)
    sendApprovedEmail({
      id: updatedReservation.id,
      user: {
        name: updatedReservation.user.name,
        email: updatedReservation.user.email,
      },
      checkIn: updatedReservation.checkIn,
      checkOut: updatedReservation.checkOut,
      guests: updatedReservation.guests,
      notes: updatedReservation.notes,
      adminComment: updatedReservation.adminComment,
    }).catch((error) => {
      console.error('Failed to send approved email, but reservation was approved:', error);
    });

    revalidatePath('/user/[id]');
    revalidatePath('/admin');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error approving reservation:', error);
    return {
      success: false,
      error: 'Error al aprobar la reserva',
    };
  }
}

export async function rejectReservation(id: string, adminId: string, adminComment?: string) {
  try {
    // Check admin authorization
    await requireAdmin();

    // Validate input
    const validation = validateData(adminActionSchema, { id, adminId, adminComment });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const { id: validId, adminId: validAdminId, adminComment: validComment } = validation.data;

    const reservation = await prisma.reservation.findUnique({
      where: { id: validId },
    });

    if (!reservation) {
      return {
        success: false,
        error: 'Reserva no encontrada',
      };
    }

    if (reservation.status !== 'PENDING') {
      return {
        success: false,
        error: 'Solo se pueden rechazar solicitudes pendientes',
      };
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id: validId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: validAdminId,
        adminComment: validComment && validComment.trim() ? validComment.trim() : null,
      },
      include: {
        user: true,
      },
    });

    // Send email notification to user (non-blocking)
    sendRejectedEmail({
      id: updatedReservation.id,
      user: {
        name: updatedReservation.user.name,
        email: updatedReservation.user.email,
      },
      checkIn: updatedReservation.checkIn,
      checkOut: updatedReservation.checkOut,
      guests: updatedReservation.guests,
      notes: updatedReservation.notes,
      adminComment: updatedReservation.adminComment,
    }).catch((error) => {
      console.error('Failed to send rejected email, but reservation was rejected:', error);
    });

    revalidatePath('/user/[id]');
    revalidatePath('/admin');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error rejecting reservation:', error);
    return {
      success: false,
      error: 'Error al rechazar la reserva',
    };
  }
}

export async function getReservationsByUser(userId: string) {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { userId },
      orderBy: { checkIn: 'desc' },
    });

    return reservations;
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    return [];
  }
}

export async function getAllReservations() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reservations;
  } catch (error) {
    console.error('Error fetching all reservations:', error);
    return [];
  }
}

export async function getReservationsForCalendar(year: number, month: number) {
  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const reservations = await prisma.reservation.findMany({
      where: {
        status: { in: ['APPROVED', 'PENDING'] },
        OR: [
          {
            AND: [
              { checkIn: { lt: endDate } },
              { checkOut: { gt: startDate } },
            ],
          },
        ],
      },
      include: {
        user: true,
      },
    });

    return reservations;
  } catch (error) {
    console.error('Error fetching calendar reservations:', error);
    return [];
  }
}

// Helper function to get available capacity for a date range
export async function getAvailableCapacity(checkIn: string, checkOut: string, excludeId?: string) {
  try {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const overlappingReservations = await prisma.reservation.findMany({
      where: {
        ...(excludeId && { id: { not: excludeId } }),
        status: { in: ['APPROVED', 'PENDING'] },
        OR: [
          {
            AND: [
              { checkIn: { lt: checkOutDate } },
              { checkOut: { gt: checkInDate } },
            ],
          },
        ],
      },
    });

    const maxGuestsPerDay = getMaxGuestsPerDay(checkInDate, checkOutDate, overlappingReservations);

    return MAX_GUESTS - maxGuestsPerDay;
  } catch (error) {
    console.error('Error getting available capacity:', error);
    return MAX_GUESTS;
  }
}

// Made with Bob
