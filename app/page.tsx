import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function HomePage() {
  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
  });

  const regularUsers = users.filter((user) => user.role === 'USER');
  const adminUser = users.find((user) => user.role === 'ADMIN');

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-light text-text-primary mb-4">
            Reservas Costa Brava
          </h1>
          <p className="text-xl text-text-secondary">
            Selecciona tu perfil para continuar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {regularUsers.map((user) => (
            <Link
              key={user.id}
              href={`/user/${user.id}`}
              className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-semibold"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <h2 className="text-xl font-medium text-text-primary group-hover:text-interactive-primary transition-colors">
                    {user.name}
                  </h2>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {adminUser && (
          <div className="flex justify-center">
            <Link
              href="/admin/login"
              className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer group w-full max-w-md"
            >
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-semibold"
                    style={{ backgroundColor: adminUser.color }}
                  >
                    🔒
                  </div>
                  <h2 className="text-xl font-medium text-text-primary group-hover:text-interactive-primary transition-colors">
                    {adminUser.name}
                  </h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Requiere contraseña
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Made with Bob
