'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Calendar from '@/components/Calendar';
import ReservationForm from '@/components/ReservationForm';
import EditReservationForm from '@/components/EditReservationForm';
import { getReservationsForCalendar, getReservationsByUser, cancelReservation } from '@/app/actions/reservations';
import { calculateNights, formatDate } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  color: string;
}

interface Reservation {
  id: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  notes: string | null;
  status: string;
  createdAt: Date;
  adminComment: string | null;
}

export default function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'reservations' | 'my-reservations'>('reservations');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [calendarReservations, setCalendarReservations] = useState<any[]>([]);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingReservation, setEditingReservation] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id, currentYear, currentMonth]);

  const loadData = async () => {
    setIsLoading(true);
    
    // Fetch user
    const userRes = await fetch(`/api/users/${id}`);
    if (userRes.ok) {
      const userData = await userRes.json();
      setUser(userData);
    }

    // Fetch calendar reservations
    const calRes = await getReservationsForCalendar(currentYear, currentMonth);
    setCalendarReservations(calRes);

    // Fetch user reservations
    const userRes2 = await getReservationsByUser(id);
    setUserReservations(userRes2);

    setIsLoading(false);
  };

  const handleDateSelect = (date: Date) => {
    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      // Start new selection
      setSelectedRange({ start: date, end: null });
    } else {
      // Complete selection
      if (date > selectedRange.start) {
        setSelectedRange({ ...selectedRange, end: date });
      } else {
        setSelectedRange({ start: date, end: null });
      }
    }
  };

  const handleCancelReservation = async (id: string, status: string) => {
    const message = status === 'APPROVED'
      ? '¿Estás seguro de que quieres cancelar esta reserva aprobada? Esta acción liberará las fechas.'
      : '¿Estás seguro de que quieres cancelar esta solicitud?';
    
    if (!confirm(message)) {
      return;
    }

    const result = await cancelReservation(id);
    if (result.success) {
      if (result.wasApproved) {
        alert('Reserva cancelada. Las fechas han sido liberadas.');
      }
      loadData();
    } else {
      alert(result.error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: 'badge badge-pending',
      APPROVED: 'badge badge-approved',
      REJECTED: 'badge badge-rejected',
      CANCELLED: 'badge badge-cancelled',
    };
    const labels = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobada',
      REJECTED: 'Rechazada',
      CANCELLED: 'Cancelada',
    };
    return (
      <span className={badges[status as keyof typeof badges]}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-text-secondary">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-semibold"
                style={{ backgroundColor: user.color }}
              >
                {user.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-medium text-text-primary">{user.name}</h1>
                <p className="text-sm text-text-secondary">Gestión de reservas</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-ui-01 rounded transition-colors"
              title="Cerrar sesión"
            >
              <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-ui-03">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('reservations')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'reservations'
                  ? 'border-interactive-primary text-interactive-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Reservas
            </button>
            <button
              onClick={() => setActiveTab('my-reservations')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'my-reservations'
                  ? 'border-interactive-primary text-interactive-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Mis Reservas
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'reservations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <Calendar
                year={currentYear}
                month={currentMonth}
                reservations={calendarReservations}
                selectedRange={selectedRange}
                onDateSelect={handleDateSelect}
                currentUserId={user.id}
                showNavigation={true}
                onMonthChange={(newYear, newMonth) => {
                  setCurrentYear(newYear);
                  setCurrentMonth(newMonth);
                }}
              />
            </div>
            <div>
              {editingReservation ? (
                <EditReservationForm
                  reservationId={editingReservation}
                  userId={user.id}
                  userName={user.name}
                  initialData={{
                    checkIn: selectedRange.start!,
                    checkOut: selectedRange.end!,
                    guests: userReservations.find(r => r.id === editingReservation)?.guests || 1,
                    notes: userReservations.find(r => r.id === editingReservation)?.notes || null,
                    status: userReservations.find(r => r.id === editingReservation)?.status,
                  }}
                  onSuccess={() => {
                    setSelectedRange({ start: null, end: null });
                    setEditingReservation(null);
                    setActiveTab('my-reservations');
                    loadData();
                  }}
                  onCancel={() => {
                    setSelectedRange({ start: null, end: null });
                    setEditingReservation(null);
                  }}
                />
              ) : (
                <ReservationForm
                  userId={user.id}
                  userName={user.name}
                  selectedRange={selectedRange}
                  onSuccess={() => {
                    setSelectedRange({ start: null, end: null });
                    loadData();
                  }}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'my-reservations' && (
          <div className="card">
            <h2 className="text-2xl font-medium text-text-primary mb-6">
              Mis Reservas
            </h2>
            {userReservations.length === 0 ? (
              <p className="text-text-secondary text-center py-8">
                No tienes reservas todavía
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Entrada</th>
                      <th>Salida</th>
                      <th>Noches</th>
                      <th>Personas</th>
                      <th>Notas</th>
                      <th>Estado</th>
                      <th>Comentario Admin</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userReservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td>{formatDate(reservation.checkIn)}</td>
                        <td>{formatDate(reservation.checkOut)}</td>
                        <td>{calculateNights(reservation.checkIn, reservation.checkOut)}</td>
                        <td>{reservation.guests}</td>
                        <td className="max-w-xs truncate">
                          {reservation.notes || '-'}
                        </td>
                        <td>{getStatusBadge(reservation.status)}</td>
                        <td className="max-w-xs">
                          {reservation.adminComment ? (
                            <span className="text-sm text-text-secondary italic">
                              "{reservation.adminComment}"
                            </span>
                          ) : (
                            <span className="text-text-secondary">-</span>
                          )}
                        </td>
                        <td>
                          {(reservation.status === 'PENDING' || reservation.status === 'APPROVED') && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  // Switch to reservations tab and pre-fill with this reservation's data
                                  setSelectedRange({
                                    start: new Date(reservation.checkIn),
                                    end: new Date(reservation.checkOut)
                                  });
                                  setEditingReservation(reservation.id);
                                  setActiveTab('reservations');
                                }}
                                className="p-2 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                                title={reservation.status === 'APPROVED' ? 'Editar reserva (volverá a estado pendiente)' : 'Editar reserva'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleCancelReservation(reservation.id, reservation.status)}
                                className="p-2 rounded bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
                                title={reservation.status === 'APPROVED' ? 'Cancelar reserva aprobada' : 'Cancelar solicitud'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Made with Bob
