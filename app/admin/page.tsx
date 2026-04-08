'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AnnualCalendar from '@/components/AnnualCalendar';
import { getAllReservations, approveReservation, rejectReservation } from '@/app/actions/reservations';
import { calculateNights, formatDate } from '@/lib/utils';

interface Reservation {
  id: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  notes: string | null;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
  user: {
    id: string;
    name: string;
    color: string;
  };
}

interface Stats {
  totalRequests: number;
  totalApproved: number;
  totalRejected: number;
  totalNights: number;
  topUser: { name: string; count: number } | null;
  reservationsByUser: Array<{ name: string; count: number; color: string }>;
  occupancyRate: number;
  nightsByUser: Array<{ name: string; nights: number; color: string }>;
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'calendar' | 'management' | 'stats'>('calendar');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [adminId, setAdminId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const isAuthenticated = sessionStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    // Get admin user
    const adminRes = await fetch('/api/users/admin');
    if (adminRes.ok) {
      const admin = await adminRes.json();
      setAdminId(admin.id);
    }

    // Get all reservations
    const allReservations = await getAllReservations();
    setReservations(allReservations);

    setIsLoading(false);
  };

  const handleApprove = async (id: string) => {
    const comment = prompt('Comentario al aprobar (opcional):');
    
    // If user cancels, don't proceed
    if (comment === null) return;

    if (!confirm('¿Aprobar esta reserva?')) return;

    const result = await approveReservation(id, adminId, comment || undefined);
    if (result.success) {
      loadData();
    } else {
      alert(result.error);
    }
  };

  const handleReject = async (id: string) => {
    const comment = prompt('Comentario al rechazar (opcional):');
    
    // If user cancels, don't proceed
    if (comment === null) return;

    if (!confirm('¿Rechazar esta reserva?')) return;

    const result = await rejectReservation(id, adminId, comment || undefined);
    if (result.success) {
      loadData();
    } else {
      alert(result.error);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    router.push('/');
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

  const calculateStats = (): Stats => {
    const totalRequests = reservations.length;
    const totalApproved = reservations.filter((r) => r.status === 'APPROVED').length;
    const totalRejected = reservations.filter((r) => r.status === 'REJECTED').length;

    const approvedReservations = reservations.filter((r) => r.status === 'APPROVED');
    const totalNights = approvedReservations.reduce(
      (sum, r) => sum + calculateNights(r.checkIn, r.checkOut),
      0
    );

    // Reservations by user
    const userCounts: Record<string, { name: string; count: number; color: string }> = {};
    approvedReservations.forEach((r) => {
      if (!userCounts[r.user.id]) {
        userCounts[r.user.id] = { name: r.user.name, count: 0, color: r.user.color };
      }
      userCounts[r.user.id].count++;
    });

    const reservationsByUser = Object.values(userCounts).sort((a, b) => b.count - a.count);
    const topUser = reservationsByUser.length > 0 ? reservationsByUser[0] : null;

    // Nights by user
    const userNights: Record<string, { name: string; nights: number; color: string }> = {};
    approvedReservations.forEach((r) => {
      if (!userNights[r.user.id]) {
        userNights[r.user.id] = { name: r.user.name, nights: 0, color: r.user.color };
      }
      userNights[r.user.id].nights += calculateNights(r.checkIn, r.checkOut);
    });

    const nightsByUser = Object.values(userNights).sort((a, b) => b.nights - a.nights);

    // Occupancy rate for current year
    const yearReservations = approvedReservations.filter(
      (r) => new Date(r.checkIn).getFullYear() === currentYear
    );
    const yearNights = yearReservations.reduce(
      (sum, r) => sum + calculateNights(r.checkIn, r.checkOut),
      0
    );
    const occupancyRate = (yearNights / 365) * 100;

    return {
      totalRequests,
      totalApproved,
      totalRejected,
      totalNights,
      topUser,
      reservationsByUser,
      occupancyRate,
      nightsByUser,
    };
  };

  const stats = calculateStats();
  const pendingReservations = reservations.filter((r) => r.status === 'PENDING');
  const yearReservations = reservations.filter(
    (r) => r.status === 'APPROVED' && new Date(r.checkIn).getFullYear() === currentYear
  );

  if (isLoading) {
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
              <div className="w-12 h-12 bg-ui-05 rounded-full flex items-center justify-center text-white text-xl">
                🔒
              </div>
              <div>
                <h1 className="text-2xl font-medium text-text-primary">Panel de Administración</h1>
                <p className="text-sm text-text-secondary">Gestión de reservas</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
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
              onClick={() => setActiveTab('calendar')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'border-interactive-primary text-interactive-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Calendario
            </button>
            <button
              onClick={() => setActiveTab('management')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'management'
                  ? 'border-interactive-primary text-interactive-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Gestión de Reservas
              {pendingReservations.length > 0 && (
                <span className="ml-2 bg-status-pending text-yellow-800 text-xs px-2 py-1 rounded-full">
                  {pendingReservations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'border-interactive-primary text-interactive-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Estadísticas
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-medium text-text-primary">
                Calendario Anual {currentYear}
              </h2>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                className="input w-32"
              >
                {[2026, 2027, 2028, 2029, 2030].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <AnnualCalendar year={currentYear} reservations={yearReservations} />
          </div>
        )}

        {/* Management Tab */}
        {activeTab === 'management' && (
          <div className="space-y-8">
            {/* Pending Requests */}
            <div className="card">
              <h2 className="text-2xl font-medium text-text-primary mb-6">
                Solicitudes Pendientes
              </h2>
              {pendingReservations.length === 0 ? (
                <p className="text-text-secondary text-center py-8">
                  No hay solicitudes pendientes
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Noches</th>
                        <th>Personas</th>
                        <th>Notas</th>
                        <th>Fecha Solicitud</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingReservations.map((reservation) => (
                        <tr key={reservation.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: reservation.user.color }}
                              ></div>
                              {reservation.user.name}
                            </div>
                          </td>
                          <td>{formatDate(reservation.checkIn)}</td>
                          <td>{formatDate(reservation.checkOut)}</td>
                          <td>{calculateNights(reservation.checkIn, reservation.checkOut)}</td>
                          <td>{reservation.guests}</td>
                          <td className="max-w-xs truncate">{reservation.notes || '-'}</td>
                          <td>{formatDate(reservation.createdAt)}</td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(reservation.id)}
                                className="p-2 rounded bg-green-50 hover:bg-green-100 text-green-700 transition-colors"
                                title="Aprobar reserva"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleReject(reservation.id)}
                                className="p-2 rounded bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
                                title="Rechazar reserva"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* All Reservations History */}
            <div className="card">
              <h2 className="text-2xl font-medium text-text-primary mb-6">
                Historial de Reservas
              </h2>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Entrada</th>
                      <th>Salida</th>
                      <th>Noches</th>
                      <th>Personas</th>
                      <th>Notas</th>
                      <th>Estado</th>
                      <th>Creada</th>
                      <th>Revisada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: reservation.user.color }}
                            ></div>
                            {reservation.user.name}
                          </div>
                        </td>
                        <td>{formatDate(reservation.checkIn)}</td>
                        <td>{formatDate(reservation.checkOut)}</td>
                        <td>{calculateNights(reservation.checkIn, reservation.checkOut)}</td>
                        <td>{reservation.guests}</td>
                        <td className="max-w-xs truncate">{reservation.notes || '-'}</td>
                        <td>{getStatusBadge(reservation.status)}</td>
                        <td>{formatDate(reservation.createdAt)}</td>
                        <td>{reservation.reviewedAt ? formatDate(reservation.reviewedAt) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-medium text-text-primary">Estadísticas</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card">
                <p className="text-sm text-text-secondary mb-2">Total Solicitudes</p>
                <p className="text-3xl font-semibold text-text-primary">{stats.totalRequests}</p>
              </div>
              <div className="card">
                <p className="text-sm text-text-secondary mb-2">Reservas Aprobadas</p>
                <p className="text-3xl font-semibold text-green-600">{stats.totalApproved}</p>
              </div>
              <div className="card">
                <p className="text-sm text-text-secondary mb-2">Reservas Rechazadas</p>
                <p className="text-3xl font-semibold text-red-600">{stats.totalRejected}</p>
              </div>
              <div className="card">
                <p className="text-sm text-text-secondary mb-2">Noches Reservadas</p>
                <p className="text-3xl font-semibold text-text-primary">{stats.totalNights}</p>
              </div>
            </div>

            {/* Occupancy Rate */}
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Tasa de Ocupación {currentYear}
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-ui-01 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-interactive-primary h-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
                  >
                    {stats.occupancyRate > 10 && `${stats.occupancyRate.toFixed(1)}%`}
                  </div>
                </div>
                <span className="text-2xl font-semibold text-text-primary">
                  {stats.occupancyRate.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Top User */}
            {stats.topUser && (
              <div className="card">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Usuario con Más Reservas
                </h3>
                <p className="text-2xl font-medium text-text-primary">
                  {stats.topUser.name} - {stats.topUser.count} reservas
                </p>
              </div>
            )}

            {/* Reservations by User */}
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Reservas Aprobadas por Usuario
              </h3>
              <div className="space-y-3">
                {stats.reservationsByUser.map((user) => (
                  <div key={user.name} className="flex items-center gap-4">
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: user.color }}
                    ></div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-text-primary">{user.name}</span>
                        <span className="text-sm text-text-secondary">{user.count} reservas</span>
                      </div>
                      <div className="bg-ui-01 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            backgroundColor: user.color,
                            width: `${(user.count / stats.totalApproved) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nights by User */}
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Noches por Usuario
              </h3>
              <div className="space-y-3">
                {stats.nightsByUser.map((user) => (
                  <div key={user.name} className="flex items-center gap-4">
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: user.color }}
                    ></div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-text-primary">{user.name}</span>
                        <span className="text-sm text-text-secondary">{user.nights} noches</span>
                      </div>
                      <div className="bg-ui-01 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            backgroundColor: user.color,
                            width: `${(user.nights / stats.totalNights) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Made with Bob
