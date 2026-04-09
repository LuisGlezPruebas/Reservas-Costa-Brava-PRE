# Deployment en Railway - Reservas Costa Brava PRE

## Pasos para desplegar

### 1. Subir el código a GitHub
```bash
cd /Users/lusglez/Desktop/Reservas
git push -u origin main
```

### 2. Crear proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza Railway a acceder a tu GitHub
5. Selecciona el repositorio: `LuisGlezPruebas/Reservas-Costa-Brava-PRE`

### 3. Configurar Variables de Entorno

En Railway, ve a tu proyecto → Variables y agrega:

**Variables requeridas:**
```
DATABASE_URL=postgresql://postgres:MWKVfpUKecTIDdiAUpeioHJBtEDHVSID@hopper.proxy.rlwy.net:52989/railway
ADMIN_PASSWORD=your-secure-password-here
SESSION_SECRET=your-session-secret-at-least-32-characters-long
RESEND_API_KEY=re_LcnCdRfF_55qUmyvAxcjfCzfDEvfq3SUS
EMAIL_FROM=Reservas Costa Brava <onboarding@resend.dev>
ADMIN_NOTIFICATION_EMAIL=luisglez.pruebas@gmail.com
NODE_ENV=production
```

**Variables opcionales (para rate limiting en producción):**
```
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
```

**IMPORTANTE:**
- Cambia `ADMIN_PASSWORD` por una contraseña segura (mínimo 12 caracteres)
- Genera `SESSION_SECRET` con: `openssl rand -base64 32`
- Para rate limiting en producción, configura Upstash Redis

### 4. Configuración del Build

Railway detectará automáticamente que es un proyecto Next.js y configurará:
- Build Command: `npm run build` (ejecutará migraciones automáticamente)
- Start Command: `npm start`

### 5. Dominio

Railway te asignará un dominio automáticamente como:
`https://tu-proyecto.up.railway.app`

Puedes configurar un dominio personalizado en Settings → Domains

### 6. Verificar Deployment

1. Espera a que el build termine (2-5 minutos)
2. Accede a la URL proporcionada
3. Verifica que la aplicación funcione correctamente
4. Prueba el login de admin en `/admin/login`

## Notas Importantes

- ✅ Las migraciones de Prisma se ejecutan automáticamente en cada deploy
- ✅ La base de datos ya está configurada en Railway
- ✅ El archivo `.env` NO se sube a GitHub (está en .gitignore)
- ⚠️ Asegúrate de configurar todas las variables de entorno en Railway
- ⚠️ Cambia la contraseña de admin antes de producción

## Troubleshooting

### Error de base de datos
- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de que la base de datos de Railway esté activa

### Error de build
- Revisa los logs en Railway
- Verifica que todas las dependencias estén en `package.json`

### Error 500
- Revisa los logs de la aplicación en Railway
- Verifica que todas las variables de entorno estén configuradas

## Comandos útiles

```bash
# Ver logs en tiempo real (desde Railway CLI)
railway logs

# Conectar a la base de datos
railway connect postgres

# Ejecutar migraciones manualmente
railway run npm run build