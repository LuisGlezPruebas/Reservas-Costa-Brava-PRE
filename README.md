# Reservas Costa Brava

Sistema de gestión de reservas para casa familiar en la Costa Brava. Aplicación web completa construida con Next.js, TypeScript, Tailwind CSS, Prisma y PostgreSQL.

## 🚀 Características

- **Gestión de usuarios**: Sistema de perfiles fijos para miembros de la familia
- **Reservas**: Solicitud, aprobación y gestión de reservas
- **Notificaciones por email**: Emails automáticos con Resend para nuevas solicitudes, aprobaciones y rechazos
- **Calendario interactivo**: Vista mensual para usuarios y vista anual para administradores
- **Panel de administración**: Gestión de solicitudes pendientes y estadísticas
- **Diseño minimalista**: Inspirado en IBM Carbon Design Language
- **Responsive**: Optimizado para escritorio y móvil

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

## 🛠️ Instalación Local

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd reservas
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/reservas?schema=public"

# Admin password (TEMPORARY - NOT SECURE FOR PRODUCTION)
ADMIN_PASSWORD="123"
NEXT_PUBLIC_ADMIN_PASSWORD="123"

# Resend Email Configuration
RESEND_API_KEY="tu_api_key_de_resend"
EMAIL_FROM="Reservas Costa Brava <onboarding@resend.dev>"
ADMIN_NOTIFICATION_EMAIL="admin@example.com"
```

**⚠️ IMPORTANTE**: La contraseña del administrador está hardcodeada para desarrollo. En producción, implementa un sistema de autenticación real.

### 4. Configurar la base de datos

#### Opción A: PostgreSQL local

Instala PostgreSQL y crea una base de datos:

```bash
# En PostgreSQL
createdb reservas
```

#### Opción B: PostgreSQL en Railway (recomendado para desarrollo)

1. Ve a [Railway.app](https://railway.app)
2. Crea un nuevo proyecto
3. Añade PostgreSQL
4. Copia la `DATABASE_URL` a tu archivo `.env`

### 5. Ejecutar migraciones

```bash
npx prisma migrate dev --name init
```

Este comando:
- Crea las tablas en la base de datos
- Genera el cliente de Prisma

### 6. Poblar la base de datos (seed)

```bash
npm run db:seed
```

Esto creará los usuarios iniciales:
- Mº Teresa
- David
- Luis Glez Llobet
- Juan
- Luis Glez Terol
- Martina
- Admin

### 7. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
reservas/
├── app/
│   ├── actions/           # Server Actions
│   │   └── reservations.ts
│   ├── admin/             # Área de administración
│   │   ├── login/
│   │   └── page.tsx
│   ├── api/               # API Routes
│   │   └── users/
│   ├── user/              # Área de usuario
│   │   └── [id]/
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout raíz
│   └── page.tsx           # Landing page
├── components/            # Componentes React
│   ├── AnnualCalendar.tsx
│   ├── Calendar.tsx
│   └── ReservationForm.tsx
├── lib/                   # Utilidades
│   ├── prisma.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   └── seed.ts            # Datos iniciales
├── .env                   # Variables de entorno (no incluir en git)
├── .env.example           # Ejemplo de variables
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 📧 Configuración de Emails (Resend)

La aplicación envía notificaciones por email automáticamente usando [Resend](https://resend.com):

### Tipos de notificaciones

1. **Nueva solicitud** → Email al administrador cuando un usuario crea una reserva
2. **Solicitud aprobada** → Email al usuario cuando el admin aprueba su reserva
3. **Solicitud rechazada** → Email al usuario cuando el admin rechaza su reserva

### Configuración de Resend

1. **Crear cuenta en Resend**:
   - Ve a [resend.com](https://resend.com)
   - Crea una cuenta gratuita
   - Genera una API Key en el dashboard

2. **Configurar variables de entorno**:
   ```env
   RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxx"
   EMAIL_FROM="Reservas Costa Brava <onboarding@resend.dev>"
   ADMIN_NOTIFICATION_EMAIL="admin@example.com"
   ```

3. **Modo de pruebas** (actual):
   - Todos los usuarios tienen el email: `luisglez.pruebas@gmail.com`
   - El administrador también usa: `luisglez.pruebas@gmail.com`
   - Esto está configurado en `prisma/seed.ts`

4. **Cambiar a emails reales**:
   - Modifica `prisma/seed.ts` para asignar emails reales a cada usuario
   - Actualiza `ADMIN_NOTIFICATION_EMAIL` en `.env`
   - Ejecuta `npm run db:seed` para actualizar la base de datos

### Características de los emails

- **Diseño HTML responsive**: Emails con formato profesional
- **Información completa**: Fechas, personas, notas y comentarios del admin
- **No bloquean la operación**: Si falla el envío, la reserva se procesa igualmente
- **Logs claros**: Errores de email se registran en consola sin afectar la funcionalidad

### Verificar dominio (Producción)

Para enviar emails desde tu propio dominio en producción:

1. Ve a Resend Dashboard → Domains
2. Añade tu dominio
3. Configura los registros DNS (SPF, DKIM)
4. Actualiza `EMAIL_FROM` con tu dominio verificado

## 🗄️ Modelo de Datos

### User
- `id`: Identificador único
- `name`: Nombre del usuario
- `email`: Email del usuario (para notificaciones)
- `role`: USER o ADMIN
- `color`: Color para el calendario (hex)
- `createdAt`, `updatedAt`: Timestamps

### Reservation
- `id`: Identificador único
- `userId`: Referencia al usuario
- `checkIn`: Fecha de entrada
- `checkOut`: Fecha de salida
- `guests`: Número de personas (1-10)
- `notes`: Notas adicionales (opcional)
- `status`: PENDING, APPROVED, REJECTED, CANCELLED
- `createdAt`, `updatedAt`: Timestamps
- `reviewedAt`: Fecha de revisión (opcional)
- `reviewedBy`: ID del admin que revisó (opcional)

## 👥 Uso de la Aplicación

### Para Usuarios Normales

1. **Acceso**: Selecciona tu perfil en la página principal
2. **Crear reserva**:
   - Ve a la pestaña "Reservas"
   - Selecciona fecha de entrada y salida en el calendario
   - Completa el formulario (personas, notas)
   - Envía la solicitud
3. **Ver mis reservas**: Pestaña "Mis Reservas" muestra tu historial
4. **Cancelar**: Puedes cancelar solicitudes pendientes

### Para Administrador

1. **Acceso**: Click en "Admin" → Introduce contraseña (123)
2. **Calendario**: Vista anual con todas las reservas aprobadas
3. **Gestión**:
   - Aprobar o rechazar solicitudes pendientes
   - Ver historial completo de reservas
4. **Estadísticas**:
   - Total de solicitudes y reservas
   - Tasa de ocupación
   - Reservas por usuario
   - Noches por usuario

## 🚢 Despliegue en Railway

### 1. Preparar el proyecto

Asegúrate de que tu código esté en un repositorio Git (GitHub, GitLab, etc.)

### 2. Crear proyecto en Railway

1. Ve a [Railway.app](https://railway.app)
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza Railway y selecciona tu repositorio

### 3. Añadir PostgreSQL

1. En tu proyecto de Railway, click en "New"
2. Selecciona "Database" → "Add PostgreSQL"
3. Railway generará automáticamente la `DATABASE_URL`

### 4. Configurar variables de entorno

En la configuración de tu servicio de Next.js:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
ADMIN_PASSWORD=tu_contraseña_segura
NEXT_PUBLIC_ADMIN_PASSWORD=tu_contraseña_segura

# Resend Email
RESEND_API_KEY=tu_api_key_de_resend
EMAIL_FROM="Reservas Costa Brava <onboarding@resend.dev>"
ADMIN_NOTIFICATION_EMAIL=admin@example.com
```

**⚠️ IMPORTANTE**: Cambia la contraseña por defecto en producción.

### 5. Configurar el build

Railway detectará automáticamente Next.js. Si necesitas configuración adicional:

**Build Command**:
```bash
npm run build
```

**Start Command**:
```bash
npm start
```

### 6. Ejecutar migraciones

Después del primer despliegue, ejecuta las migraciones:

1. Ve a tu servicio en Railway
2. Click en "Settings" → "Deploy"
3. Añade un comando de inicio personalizado:

```bash
npx prisma migrate deploy && npm start
```

O ejecuta manualmente desde la terminal de Railway:

```bash
npx prisma migrate deploy
npx prisma db seed
```

### 7. Dominio personalizado (opcional)

1. En Railway, ve a "Settings" → "Domains"
2. Genera un dominio de Railway o conecta tu dominio personalizado

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm start            # Servidor de producción
npm run lint         # Linter
npm run db:seed      # Poblar base de datos
```

## 🎨 Personalización

### Colores de usuarios

Los colores se definen en `prisma/seed.ts`. Para cambiarlos:

1. Modifica los colores en el seed
2. Ejecuta `npm run db:seed` nuevamente

### Estilos

Los estilos globales están en `app/globals.css` y la configuración de Tailwind en `tailwind.config.ts`.

## 🔐 Seguridad

**⚠️ ADVERTENCIAS IMPORTANTES**:

1. **Contraseña del admin**: La contraseña actual (123) es solo para desarrollo. En producción:
   - Usa variables de entorno seguras
   - Implementa autenticación real (NextAuth.js, Auth0, etc.)
   - Añade hash de contraseñas

2. **Autenticación de usuarios**: Actualmente no hay autenticación real para usuarios normales. Para producción:
   - Implementa sistema de login
   - Añade sesiones seguras
   - Protege las rutas

3. **Variables de entorno**: Nunca subas `.env` a Git

## 📝 Comandos Útiles de Prisma

```bash
# Ver base de datos en navegador
npx prisma studio

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Resetear base de datos (⚠️ borra todos los datos)
npx prisma migrate reset

# Generar cliente de Prisma
npx prisma generate

# Formatear schema
npx prisma format
```

## 🐛 Troubleshooting

### Error: "Can't reach database server"

- Verifica que PostgreSQL esté corriendo
- Comprueba la `DATABASE_URL` en `.env`
- Asegúrate de que el puerto no esté bloqueado

### Error: "Module not found: Can't resolve '@prisma/client'"

```bash
npx prisma generate
```

### Error en producción: "PrismaClient is unable to run in the browser"

- Asegúrate de usar Server Components o Server Actions
- No importes `@prisma/client` en componentes cliente

### Estilos no se aplican

```bash
# Limpia caché de Next.js
rm -rf .next
npm run dev
```

## 📄 Licencia

Este proyecto es privado y de uso familiar.

## 👨‍💻 Desarrollo

Desarrollado con ❤️ para la familia.

---

**Versión**: 1.0.0  
**Última actualización**: Marzo 2026