'use client';

import { getMonthDays, getMonthName, getDayName, getFirstDayOfWeekAdjusted } from '@/lib/utils';

interface AnnualCalendarProps {
  year: number;
  reservations: Array<{
    id: string;
    checkIn: Date;
    checkOut: Date;
    status: string;
    guests: number;
    user: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

export default function AnnualCalendar({ year, reservations }: AnnualCalendarProps) {
  const months = Array.from({ length: 12 }, (_, i) => i);

  const getDayStatus = (date: Date) => {
    const current = new Date(date);
    current.setHours(0, 0, 0, 0);

    // Find all approved reservations that overlap with this date
    const overlappingReservations = reservations.filter(reservation => {
      if (reservation.status !== 'APPROVED') return false;

      const checkIn = new Date(reservation.checkIn);
      const checkOut = new Date(reservation.checkOut);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);

      return current >= checkIn && current <= checkOut;
    });

    if (overlappingReservations.length === 0) {
      return { isOccupied: false, colors: [], userNames: [], totalGuests: 0 };
    }

    // Multiple reservations on the same day
    const colors = overlappingReservations.map(r => r.user.color);
    const userNames = overlappingReservations.map(r => r.user.name);
    const totalGuests = overlappingReservations.reduce((sum, r) => sum + r.guests, 0);

    return {
      isOccupied: true,
      colors,
      userNames,
      totalGuests,
    };
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Get unique users with reservations
  const usersWithReservations = Array.from(
    new Set(
      reservations
        .filter((r) => r.status === 'APPROVED')
        .map((r) => JSON.stringify({ id: r.user.id, name: r.user.name, color: r.user.color }))
    )
  ).map((str) => JSON.parse(str));

  return (
    <div className="space-y-8">
      {/* Legend */}
      <div className="card">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Leyenda</h3>
        <div className="flex flex-wrap gap-4">
          {usersWithReservations.map((user) => (
            <div key={user.id} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: user.color }}
              ></div>
              <span className="text-sm text-text-secondary">{user.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {months.map((month) => {
          const days = getMonthDays(year, month);
          const firstDayOfWeek = days[0].getDay();

          const adjustedFirstDay = getFirstDayOfWeekAdjusted(days[0]);
          
          return (
            <div key={month} className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                {getMonthName(month)}
              </h3>

              <div className="grid grid-cols-7 gap-1">
                {/* Day headers - Monday to Sunday */}
                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold text-text-secondary py-1"
                  >
                    {getDayName(day).charAt(0)}
                  </div>
                ))}

                {/* Empty cells */}
                {Array.from({ length: adjustedFirstDay }).map((_, index) => (
                  <div key={`empty-${index}`} />
                ))}

                {/* Calendar days */}
                {days.map((date) => {
                  const { isOccupied, colors, userNames, totalGuests } = getDayStatus(date);
                  const isPast = isPastDate(date);

                  // Create gradient for multiple users
                  const getBackgroundStyle = () => {
                    if (!isOccupied || colors.length === 0) return undefined;
                    
                    if (colors.length === 1) {
                      return { backgroundColor: colors[0] };
                    }
                    
                    // Create diagonal gradient for multiple users
                    const gradientStops = colors.map((color, i) => {
                      const start = (i / colors.length) * 100;
                      const end = ((i + 1) / colors.length) * 100;
                      return `${color} ${start}%, ${color} ${end}%`;
                    }).join(', ');
                    
                    return {
                      background: `linear-gradient(135deg, ${gradientStops})`,
                    };
                  };

                  const tooltipText = isOccupied
                    ? `${userNames.join(' + ')} (${totalGuests} ${totalGuests === 1 ? 'persona' : 'personas'})`
                    : undefined;

                  return (
                    <div
                      key={date.toISOString()}
                      className={`
                        aspect-square flex items-center justify-center text-xs rounded relative
                        ${isPast ? 'bg-gray-100 text-gray-400 opacity-50' : ''}
                        ${!isPast && isOccupied ? 'text-white font-medium' : ''}
                        ${!isPast && !isOccupied ? 'bg-green-50 text-text-primary' : ''}
                      `}
                      style={!isPast ? getBackgroundStyle() : undefined}
                      title={tooltipText}
                    >
                      {date.getDate()}
                      {!isPast && isOccupied && colors.length > 1 && (
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-white rounded-full opacity-75"
                             title="Reserva compartida" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Made with Bob
