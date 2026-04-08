import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.reservation.deleteMany();
  await prisma.user.deleteMany();

  // Create users with pastel colors
  const users = [
    {
      name: 'Maria Teresa',
      email: 'luisglez.pruebas@gmail.com',
      role: 'USER' as const,
      color: '#A8C5E6', // Pastel Blue
    },
    {
      name: 'David',
      email: 'luisglez.pruebas@gmail.com',
      role: 'USER' as const,
      color: '#D4B5E8', // Pastel Purple
    },
    {
      name: 'Luis Glez Llobet',
      email: 'luisglez.pruebas@gmail.com',
      role: 'USER' as const,
      color: '#B3E5FC', // Pastel Cyan
    },
    {
      name: 'Luis Glez Terol',
      email: 'luisglez.pruebas@gmail.com',
      role: 'USER' as const,
      color: '#FFD9A3', // Pastel Peach/Orange
    },
    {
      name: 'Juan',
      email: 'luisglez.pruebas@gmail.com',
      role: 'USER' as const,
      color: '#F8BBD0', // Pastel Pink
    },
    {
      name: 'Martina',
      email: 'luisglez.pruebas@gmail.com',
      role: 'USER' as const,
      color: '#FFCCBC', // Pastel Coral
    },
    {
      name: 'Administrador',
      email: 'luisglez.pruebas@gmail.com',
      role: 'ADMIN' as const,
      color: '#161616', // Black - Password: 123
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData,
    });
    console.log(`✅ Created user: ${user.name} (${user.role})`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Made with Bob
