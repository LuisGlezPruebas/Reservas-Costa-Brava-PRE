import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reservas Costa Brava',
  description: 'Sistema de gestión de reservas para casa familiar',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

// Made with Bob
