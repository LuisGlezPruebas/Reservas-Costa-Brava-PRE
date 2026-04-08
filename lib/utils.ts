import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Date utilities
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateForInput(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  // Use local date to avoid timezone issues
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const start = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
  const end = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function isDateInRange(
  date: Date,
  rangeStart: Date | string,
  rangeEnd: Date | string
): boolean {
  const start = typeof rangeStart === 'string' ? new Date(rangeStart) : rangeStart;
  const end = typeof rangeEnd === 'string' ? new Date(rangeEnd) : rangeEnd;
  return date >= start && date <= end;
}

export function doRangesOverlap(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean {
  const s1 = typeof start1 === 'string' ? new Date(start1) : start1;
  const e1 = typeof end1 === 'string' ? new Date(end1) : end1;
  const s2 = typeof start2 === 'string' ? new Date(start2) : start2;
  const e2 = typeof end2 === 'string' ? new Date(end2) : end2;

  return s1 <= e2 && e1 >= s2;
}

export function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

export function getMonthName(month: number): string {
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  return months[month];
}

export function getDayName(day: number): string {
  // Adjusted for Monday-Sunday (0=Monday, 6=Sunday)
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return days[day];
}

export function getFirstDayOfWeekAdjusted(date: Date): number {
  // JavaScript getDay() returns 0 for Sunday, 1 for Monday, etc.
  // We want Monday=0, Tuesday=1, ..., Sunday=6
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

// Made with Bob
