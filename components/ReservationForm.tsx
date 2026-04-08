'use client';

import { useState, useEffect } from 'react';
import { createReservation, getAvailableCapacity } from '@/app/actions/reservations';
import { calculateNights, formatDateForInput } from '@/lib/utils';

interface ReservationFormProps {
  userId: string;
  userName: string;
  selectedRange: {
    start: Date | null;
    end: Date | null;
  };
  onSuccess?: () => void;
}

export default function ReservationForm({
  userId,
  userName,
  selectedRange,
  onSuccess,
}: ReservationFormProps) {
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availableCapacity, setAvailableCapacity] = useState(10);
  const [isCheckingCapacity, setIsCheckingCapacity] = useState(false);

  // Check available capacity when dates change
  useEffect(() => {
    const checkCapacity = async () => {
      if (selectedRange.start && selectedRange.end) {
        setIsCheckingCapacity(true);
        const capacity = await getAvailableCapacity(
          formatDateForInput(selectedRange.start),
          formatDateForInput(selectedRange.end)
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
  }, [selectedRange.start, selectedRange.end]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRange.start || !selectedRange.end) {
      setError('Por favor selecciona las fechas de entrada y salida');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const result = await createReservation({
      userId,
      checkIn: formatDateForInput(selectedRange.start),
      checkOut: formatDateForInput(selectedRange.end),
      guests,
      notes: notes.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setNotes('');
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } else {
      setError(result.error || 'Error al crear la reserva');
    }
  };

  const nights = selectedRange.start && selectedRange.end
    ? calculateNights(selectedRange.start, selectedRange.end)
    : 0;

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-text-primary mb-6">
        Nueva Reserva
      </h3>

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
            type="text"
            value={
              selectedRange.start
                ? selectedRange.start.toLocaleDateString('es-ES')
                : 'Selecciona en el calendario'
            }
            disabled
            className="input bg-ui-01 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Fecha de salida
          </label>
          <input
            type="text"
            value={
              selectedRange.end
                ? selectedRange.end.toLocaleDateString('es-ES')
                : 'Selecciona en el calendario'
            }
            disabled
            className="input bg-ui-01 cursor-not-allowed"
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
          {availableCapacity < 10 && selectedRange.start && selectedRange.end && (
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
            ¡Solicitud enviada correctamente!
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedRange.start || !selectedRange.end || isSubmitting}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
        </button>

        <p className="text-xs text-text-secondary text-center">
          Tu solicitud quedará pendiente hasta que sea aprobada por el administrador
        </p>
      </form>
    </div>
  );
}

// Made with Bob
