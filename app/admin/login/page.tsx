'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple password check
    if (password === '123') {
      // Store admin session (simple approach)
      sessionStorage.setItem('admin_authenticated', 'true');
      window.location.href = '/admin';
    } else {
      setError('Contraseña incorrecta');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-ui-05 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl">
            🔒
          </div>
          <h1 className="text-3xl font-light text-text-primary mb-2">
            Acceso Administrador
          </h1>
          <p className="text-text-secondary">
            Introduce la contraseña para continuar
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Introduce la contraseña"
                required
                autoFocus
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full"
            >
              {isLoading ? 'Verificando...' : 'Acceder'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/')}
              className="btn btn-ghost w-full"
              disabled={isLoading}
            >
              Volver
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-ui-03">
            <p className="text-xs text-text-secondary text-center">
              Contraseña: 123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
