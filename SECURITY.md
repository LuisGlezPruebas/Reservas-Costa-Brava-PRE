# 🔒 Guía de Seguridad - Reservas Costa Brava

## Medidas de Seguridad Implementadas

### ✅ 1. Autenticación y Autorización

#### Sistema de Sesiones Seguras
- **Iron Session**: Sesiones encriptadas con cookies httpOnly
- **Duración**: 24 horas
- **Protección CSRF**: Cookies con sameSite='lax'
- **Middleware**: Protección automática de rutas `/admin/*`

#### Autenticación de Admin
- Contraseña almacenada en variable de entorno
- Sin exposición en el cliente
- Validación server-side

**Archivos clave:**
- `lib/auth.ts` - Funciones de autenticación
- `middleware.ts` - Protección de rutas
- `app/api/auth/*` - Endpoints de autenticación

### ✅ 2. Rate Limiting

#### Límites Implementados
- **General**: 10 peticiones por 10 segundos
- **Login**: 5 intentos por minuto
- **Producción**: Upstash Redis (opcional)
- **Desarrollo**: In-memory store

**Protección contra:**
- Ataques de fuerza bruta
- DDoS básicos
- Abuso de APIs

**Archivo:** `lib/rate-limit.ts`

### ✅ 3. Validación de Datos

#### Zod Schemas
Todos los inputs son validados con Zod:
- Tipos de datos correctos
- Longitud de strings
- Formato de fechas
- IDs válidos (CUID)

**Validaciones:**
- Reservas (crear/actualizar)
- Acciones de admin
- Parámetros de calendario
- Credenciales de login

**Archivo:** `lib/validations.ts`

### ✅ 4. Protección de APIs

#### Verificación de Permisos
- `requireAuth()` - Usuario autenticado
- `requireAdmin()` - Permisos de administrador
- Validación de propiedad de datos

**APIs protegidas:**
- `/api/users/admin` - Solo admin autenticado
- `/api/users/[id]` - Acceso público (solo datos no sensibles)
- Server Actions de admin - Requieren autenticación de admin
- Server Actions de usuario - Sin autenticación (validación por lógica de negocio)

**Nota:** Las páginas de usuario no requieren autenticación para permitir acceso directo. La seguridad se mantiene mediante:
- Validación de datos en server actions
- Usuarios solo pueden modificar sus propias reservas
- Operaciones de admin protegidas con `requireAdmin()`

### ✅ 5. Headers de Seguridad

```
✓ Strict-Transport-Security (HSTS)
✓ X-Frame-Options (Clickjacking)
✓ X-Content-Type-Options (MIME sniffing)
✓ X-XSS-Protection
✓ Content-Security-Policy (CSP)
✓ Referrer-Policy
✓ Permissions-Policy
```

**Archivo:** `next.config.ts`

### ✅ 6. Protección de Datos Sensibles

#### Variables de Entorno
- `.env` en `.gitignore`
- `.env.example` como template
- Validación de variables requeridas

#### Datos No Expuestos
- Contraseñas nunca en el cliente
- Session secrets encriptados
- API keys en servidor

---

## 🚀 Configuración para Producción

### 1. Variables de Entorno Obligatorias

```bash
# Contraseña fuerte (mínimo 12 caracteres)
ADMIN_PASSWORD="Tu_Contraseña_Segura_123!"

# Secret para sesiones (32+ caracteres)
# Generar con: openssl rand -base64 32
SESSION_SECRET="tu-secret-aleatorio-de-32-caracteres-minimo"

# Base de datos
DATABASE_URL="postgresql://..."

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="..."
ADMIN_NOTIFICATION_EMAIL="..."

# Entorno
NODE_ENV="production"
```

### 2. Rate Limiting en Producción (Recomendado)

Para rate limiting robusto, configura Upstash Redis:

1. Crea cuenta en [upstash.com](https://upstash.com)
2. Crea una base de datos Redis
3. Agrega las variables:

```bash
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### 3. Checklist Pre-Deployment

- [ ] Cambiar `ADMIN_PASSWORD` por contraseña segura
- [ ] Generar `SESSION_SECRET` único
- [ ] Configurar `DATABASE_URL` de producción
- [ ] Verificar `RESEND_API_KEY` válido
- [ ] Configurar Upstash Redis (opcional pero recomendado)
- [ ] Establecer `NODE_ENV=production`
- [ ] Verificar que `.env` NO esté en git

---

## 🛡️ Mejores Prácticas

### Para Administradores

1. **Contraseña Segura**
   - Mínimo 12 caracteres
   - Combinar mayúsculas, minúsculas, números y símbolos
   - No reutilizar contraseñas

2. **Sesiones**
   - Cerrar sesión al terminar
   - No compartir credenciales
   - Usar HTTPS siempre

3. **Monitoreo**
   - Revisar logs regularmente
   - Detectar actividad sospechosa
   - Actualizar dependencias

### Para Desarrolladores

1. **Nunca Commitear**
   - Archivos `.env`
   - Contraseñas o secrets
   - API keys

2. **Validar Siempre**
   - Inputs del usuario
   - Parámetros de URL
   - Datos de formularios

3. **Mantener Actualizado**
   - Dependencias de npm
   - Prisma y base de datos
   - Next.js

---

## 🔍 Auditoría de Seguridad

### Herramientas Recomendadas

```bash
# Escanear vulnerabilidades en dependencias
npm audit

# Actualizar dependencias con vulnerabilidades
npm audit fix

# Verificar tipos TypeScript
npm run build
```

### Logs a Monitorear

- Intentos de login fallidos
- Peticiones bloqueadas por rate limit
- Errores 401/403 frecuentes
- Accesos a rutas protegidas

---

## 📞 Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:

1. **NO** la publiques públicamente
2. Contacta al administrador directamente
3. Proporciona detalles y pasos para reproducir
4. Espera confirmación antes de divulgar

---

## 🔄 Actualizaciones de Seguridad

### Última actualización: 2026-04-09

**Cambios implementados:**
- ✅ Sistema de autenticación con iron-session
- ✅ Rate limiting con Upstash
- ✅ Validación de datos con Zod
- ✅ Headers de seguridad
- ✅ Protección de APIs
- ✅ Middleware de autorización

**Próximas mejoras:**
- [ ] Logging centralizado
- [ ] Alertas de seguridad
- [ ] 2FA para admin
- [ ] Auditoría de accesos

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Iron Session](https://github.com/vvo/iron-session)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)
- [Zod Validation](https://zod.dev/)