'use client';

import { useState } from 'react';
import { getMonthDays, getMonthName, getDayName, getFirstDayOfWeekAdjusted } from '@/lib/utils';

const MAX_GUESTS = 10;

interface CalendarProps {
  year: number;
  month: number;
  reservations: Array<{
    id: string;
    checkIn: Date;
    checkOut: Date;
    status: string;
    userId: string;
    guests: number;
  }>;
  selectedRange?: {
    start: Date | null;
    end: Date | null;
  };
  onDateSelect?: (date: Date) => void;
  showUserColors?: boolean;
  userColors?: Record<string, string>;
  currentUserId?: string;
  onMonthChange?: (year: number, month: number) => void;
  showNavigation?: boolean;
}

export default function Calendar({
  year,
  month,
  reservations,
  selectedRange,
  onDateSelect,
  showUserColors = false,
  userColors = {},
  currentUserId,
  onMonthChange,
  showNavigation = false,
}: CalendarProps) {
  const days = getMonthDays(year, month);
  const firstDayOfWeek = getFirstDayOfWeekAdjusted(days[0]);

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const getDayStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];

    // Check if date is past
    if (isPastDate(date)) {
      return { status: 'past', color: null, userId: null, totalGuests: 0, userIds: [] };
    }

    // Check if date is in selected range (including single date selection)
    if (selectedRange?.start) {
      const start = new Date(selectedRange.start);
      start.setHours(0, 0, 0, 0);
      const current = new Date(date);
      current.setHours(0, 0, 0, 0);

      // If only start is selected, highlight just that day
      if (!selectedRange.end && current.getTime() === start.getTime()) {
        return { status: 'selected', color: null, userId: null, totalGuests: 0, userIds: [] };
      }

      // If both start and end are selected, highlight the range (inclusive)
      if (selectedRange.end) {
        const end = new Date(selectedRange.end);
        end.setHours(0, 0, 0, 0);

        if (current >= start && current <= end) {
          return { status: 'selected', color: null, userId: null, totalGuests: 0, userIds: [] };
        }
      }
    }

    // Check reservations - collect all overlapping reservations
    const overlappingReservations = reservations.filter(reservation => {
      const checkIn = new Date(reservation.checkIn);
      const checkOut = new Date(reservation.checkOut);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);
      const current = new Date(date);
      current.setHours(0, 0, 0, 0);

      return current >= checkIn && current <= checkOut;
    });

    if (overlappingReservations.length === 0) {
      return { status: 'available', color: null, userId: null, totalGuests: 0, userIds: [] };
    }

    // Calculate total guests for approved and pending reservations
    const approvedReservations = overlappingReservations.filter(r => r.status === 'APPROVED');
    const pendingReservations = overlappingReservations.filter(r => r.status === 'PENDING');
    
    const totalApprovedGuests = approvedReservations.reduce((sum, r) => sum + r.guests, 0);
    const totalPendingGuests = pendingReservations.reduce((sum, r) => sum + r.guests, 0);
    const totalGuests = totalApprovedGuests + totalPendingGuests;

    // Get user IDs for color mixing
    const userIds = approvedReservations.map(r => r.userId);

    // If there are approved reservations
    if (approvedReservations.length > 0) {
      if (totalApprovedGuests >= MAX_GUESTS) {
        // Fully occupied
        return {
          status: 'occupied',
          color: showUserColors && userIds.length > 0 ? userColors[userIds[0]] : null,
          userId: userIds[0],
          totalGuests: totalApprovedGuests,
          userIds,
        };
      } else {
        // Partially available
        return {
          status: 'partial',
          color: showUserColors && userIds.length > 0 ? userColors[userIds[0]] : null,
          userId: userIds[0],
          totalGuests: totalApprovedGuests,
          userIds,
          availableCapacity: MAX_GUESTS - totalApprovedGuests,
        };
      }
    }

    // If only pending reservations
    if (pendingReservations.length > 0) {
      const ownPending = pendingReservations.find(r => r.userId === currentUserId);
      if (ownPending) {
        return { status: 'pending', color: null, userId: currentUserId, totalGuests: totalPendingGuests, userIds: [] };
      } else {
        // Other user's pending - show as partial if capacity allows
        if (totalPendingGuests >= MAX_GUESTS) {
          return { status: 'occupied', color: null, userId: null, totalGuests: totalPendingGuests, userIds: [] };
        } else {
          return {
            status: 'partial',
            color: null,
            userId: null,
            totalGuests: totalPendingGuests,
            userIds: [],
            availableCapacity: MAX_GUESTS - totalPendingGuests,
          };
        }
      }
    }

    return { status: 'available', color: null, userId: null, totalGuests: 0, userIds: [] };
  };

  const getStatusClasses = (status: string, color: string | null) => {
    if (status === 'past') {
      return 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50';
    }
    if (status === 'selected') {
      return 'bg-status-selected border-blue-300 text-blue-900';
    }
    if (status === 'occupied') {
      if (color) {
        return 'border-2 font-medium';
      }
      return 'bg-status-occupied text-red-900 border-red-300';
    }
    if (status === 'partial') {
      if (color) {
        return 'border-2 font-medium';
      }
      return 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-900';
    }
    if (status === 'pending') {
      return 'bg-status-pending text-yellow-900 border-yellow-300';
    }
    // Disponible - verde claro pastel
    return 'bg-green-50 hover:bg-green-100 border-green-200 text-green-900';
  };

  const handlePrevMonth = () => {
    if (onMonthChange) {
      if (month === 0) {
        onMonthChange(year - 1, 11);
      } else {
        onMonthChange(year, month - 1);
      }
    }
  };

  const handleNextMonth = () => {
    if (onMonthChange) {
      if (month === 11) {
        onMonthChange(year + 1, 0);
      } else {
        onMonthChange(year, month + 1);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-ui-03 p-6">
      <div className="mb-4">
        {showNavigation ? (
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-ui-01 rounded transition-colors"
              title="Mes anterior"
            >
              <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-medium text-text-primary">
              {getMonthName(month)} {year}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-ui-01 rounded transition-colors"
              title="Mes siguiente"
            >
              <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : (
          <h2 className="text-2xl font-medium text-text-primary">
            {getMonthName(month)} {year}
          </h2>
        )}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Day headers - Monday to Sunday */}
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-text-secondary py-2"
          >
            {getDayName(day)}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}

        {/* Calendar days */}
        {days.map((date) => {
          const dayInfo = getDayStatus(date);
          const { status, color, userId, totalGuests, userIds, availableCapacity } = dayInfo;
          const isToday = date.toDateString() === new Date().toDateString();
          const isPast = isPastDate(date);

          // Allow selection if available or partial
          const canSelect = onDateSelect && !isPast && (status === 'available' || status === 'partial');

          return (
            <button
              key={date.toISOString()}
              onClick={() => {
                if (canSelect) {
                  onDateSelect(date);
                }
              }}
              disabled={!canSelect}
              className={`
                aspect-square p-2 rounded border-2 transition-all relative
                ${getStatusClasses(status, color)}
                ${isToday ? 'ring-2 ring-interactive-primary ring-offset-2' : ''}
                ${canSelect ? 'cursor-pointer' : 'cursor-not-allowed'}
              `}
              style={
                color && status === 'partial' && userIds && userIds.length > 1
                  ? {
                      background: `linear-gradient(135deg, ${userIds.map((uid, i) =>
                        `${userColors[uid]} ${i * (100 / userIds.length)}%, ${userColors[uid]} ${(i + 1) * (100 / userIds.length)}%`
                      ).join(', ')})`,
                      borderColor: color,
                    }
                  : color
                  ? {
                      backgroundColor: color,
                      borderColor: color,
                    }
                  : undefined
              }
              title={
                status === 'partial' && availableCapacity
                  ? `Disponible para ${availableCapacity} ${availableCapacity === 1 ? 'persona' : 'personas'} más`
                  : status === 'occupied'
                  ? 'Completamente ocupado'
                  : undefined
              }
            >
              <div className="text-sm font-medium">{date.getDate()}</div>
              {status === 'partial' && availableCapacity && (
                <div className="text-xs mt-0.5">+{availableCapacity}</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-50 border-2 border-green-200 rounded"></div>
          <span className="text-text-secondary">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded"></div>
          <span className="text-text-secondary">Parcialmente disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-status-pending border-2 border-yellow-300 rounded"></div>
          <span className="text-text-secondary">Pendiente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-status-occupied border-2 border-red-300 rounded"></div>
          <span className="text-text-secondary">Ocupado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded"></div>
          <span className="text-text-secondary">Pasado</span>
        </div>
        {selectedRange && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-status-selected border-2 border-blue-300 rounded"></div>
            <span className="text-text-secondary">Seleccionado</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Made with Bob
