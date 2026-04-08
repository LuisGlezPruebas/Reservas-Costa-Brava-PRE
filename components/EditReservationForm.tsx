'use client';

import { useState, useEffect } from 'react';
import { updateReservation, getAvailableCapacity } from '@/app/actions/reservations';
import { calculateNights, formatDateForInput } from '@/lib/utils';

interface EditReservationFormProps {
  reservationId: string;
  userId: string;
  userName: string;
  initialData: {
    checkIn: Date;
    checkOut: Date;
    guests: number;
    notes: string | null;
    status?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EditReservationForm({
  reservationId,
  userId,
  userName,
  initialData,
  onSuccess,
  onCancel,
}: EditReservationFormProps) {
  const isApproved = initialData.status === 'APPROVED';
  const [checkIn, setCheckIn] = useState(formatDateForInput(initialData.checkIn));
  const [checkOut, setCheckOut] = useState(formatDateForInput(initialData.checkOut));
  const [guests, setGuests] = useState(initialData.guests);
  const [notes, setNotes] = useState(initialData.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availableCapacity, setAvailableCapacity] = useState(10);
  const [isCheckingCapacity, setIsCheckingCapacity] = useState(false);

  // Check available capacity when dates change
  useEffect(() => {
    const checkCapacity = async () => {
      if (checkIn && checkOut) {
        setIsCheckingCapacity(true);
        const capacity = await getAvailableCapacity(
          checkIn,
          checkOut,
          reservationId // Exclude current reservation from capacity check
        );
        setAvailableCapacity(capacity);
        setIsCheckingCapacity(false);
        
        // Adjust guests if current selection exceeds capacity
        if (guests > capacity) {
          setGuests(Math.max(1, capacity));
        }
      } else {
        setAvailableCapacity(10);
      }
    };

    checkCapacity();
  }, [checkIn, checkOut, reservationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkIn || !checkOut) {
      setError('Por favor selecciona las fechas de entrada y salida');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const result = await updateReservation(reservationId, {
      checkIn,
      checkOut,
      guests,
      notes: notes.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      if (result.wasApproved) {
        alert('Reserva actualizada correctamente. Solo se han modificado las personas y/o notas, por lo que mantiene su estado de aprobada.');
      }
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 1500);
    } else {
      setError(result.error || 'Error al actualizar la reserva');
    }
  };

  const nights = checkIn && checkOut
    ? calculateNights(new Date(checkIn), new Date(checkOut))
    : 0;

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-text-primary mb-6">
        Editar Reserva
      </h3>

      {isApproved && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded">
          <p className="text-sm font-medium">ℹ️ Reserva Aprobada - Edición Limitada</p>
          <p className="text-sm mt-1">
            Solo puedes editar el <strong>número de personas</strong> y las <strong>notas</strong>.
          </p>
          <p className="text-sm mt-1">
            <strong>Para cambiar las fechas:</strong> debes rechazar esta reserva y crear una nueva solicitud.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Usuario
          </label>
          <input
            type="text"
            value={userName}
            disabled
            className="input bg-ui-01 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Fecha de entrada
          </label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="input"
            required
            disabled={isApproved}
            title={isApproved ? "No se pueden cambiar las fechas de una reserva aprobada" : ""}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Fecha de salida
          </label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="input"
            required
            disabled={isApproved}
            title={isApproved ? "No se pueden cambiar las fechas de una reserva aprobada" : ""}
          />
        </div>

        {nights > 0 && (
          <div className="bg-ui-01 p-3 rounded">
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">{nights}</span>{' '}
              {nights === 1 ? 'noche' : 'noches'}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Número de personas
            {isCheckingCapacity && (
              <span className="text-xs text-text-secondary ml-2">(Verificando disponibilidad...)</span>
            )}
          </label>
          <select
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value))}
            className="input"
            required
            disabled={isCheckingCapacity}
          >
            {Array.from({ length: availableCapacity }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'persona' : 'personas'}
              </option>
            ))}
          </select>
          {availableCapacity < 10 && checkIn && checkOut && (
            <p className="mt-2 text-sm text-orange-600">
              ℹ️ Capacidad limitada: solo {availableCapacity} {availableCapacity === 1 ? 'plaza disponible' : 'plazas disponibles'} en estas fechas
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Notas adicionales (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="textarea"
            placeholder="Añade cualquier información adicional..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            ¡Reserva actualizada correctamente!
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Actualizando...' : 'Actualizar Reserva'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost"
          >
            Cancelar
          </button>
        </div>

        <p className="text-xs text-text-secondary text-center">
          {isApproved
            ? 'Solo se pueden editar personas y notas. Para cambiar fechas, rechaza esta reserva y crea una nueva.'
            : 'La reserva seguirá pendiente hasta que sea aprobada por el administrador'
          }
        </p>
      </form>
    </div>
  );
}

// Made with Bob
