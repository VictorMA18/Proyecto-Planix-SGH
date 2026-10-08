-- =====================================================================
-- Sistema de Gestión de Horarios (SGH)
-- Esquema de Base de Datos - PostgreSQL 14+
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- para gen_random_uuid()

-- =====================================================================
-- ENUMS
-- =====================================================================

CREATE TYPE rol_miembro AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLEADO');
CREATE TYPE estado_miembro AS ENUM ('ACTIVO', 'INVITADO', 'INACTIVO');
CREATE TYPE estado_jornada AS ENUM ('DENTRO', 'FUERA');
CREATE TYPE tipo_movimiento_asistencia AS ENUM ('ENTRADA', 'SALIDA');
CREATE TYPE estado_asignacion_tarea AS ENUM ('PENDIENTE', 'VISTA', 'COMPLETADA');
CREATE TYPE tipo_notificacion AS ENUM ('TAREA_ASIGNADA', 'QR_DISPONIBLE', 'RECORDATORIO_SALIDA', 'SISTEMA');
CREATE TYPE plataforma_dispositivo AS ENUM ('ANDROID', 'IOS', 'WEB');
CREATE TYPE estado_invitacion AS ENUM ('PENDIENTE', 'ACEPTADA', 'EXPIRADA', 'CANCELADA');

-- =====================================================================
-- TABLA: organizaciones
-- =====================================================================

CREATE TABLE organizaciones (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre              VARCHAR(150) NOT NULL,
    slug                VARCHAR(160) NOT NULL UNIQUE,
    zona_horaria        VARCHAR(64) NOT NULL DEFAULT 'America/Lima',
    logo_url            TEXT,
    activa              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- TABLA: usuarios
-- =====================================================================

CREATE TABLE usuarios (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id            VARCHAR(255) NOT NULL UNIQUE, -- id del usuario en Clerk (fuente de verdad de auth)
    nombre              VARCHAR(150) NOT NULL,           -- nombre completo (nombres + apellidos), calculado al sincronizar
    nombres             VARCHAR(100) NOT NULL DEFAULT '', -- first_name de Clerk
    apellidos           VARCHAR(100) NOT NULL DEFAULT '', -- last_name de Clerk
    email               VARCHAR(255) NOT NULL UNIQUE,
    email_verificado    BOOLEAN NOT NULL DEFAULT FALSE,   -- estado de verificación del correo principal en Clerk
    avatar_url          TEXT,
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usuarios_email ON usuarios (email);
CREATE INDEX idx_usuarios_clerk_id ON usuarios (clerk_id);

-- =====================================================================
-- TABLA: miembros_organizacion (relación usuario <-> organización + rol)
-- El rol vive AQUÍ, no en `usuarios`. Un mismo usuario_id puede tener
-- múltiples filas en esta tabla -una por organización distinta- con
-- roles independientes entre sí (ej. ADMIN en una organización y
-- EMPLEADO en otra). El UNIQUE de abajo solo evita membresías
-- duplicadas dentro de la MISMA organización.
-- =====================================================================

CREATE TABLE miembros_organizacion (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id          UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    organizacion_id     UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    rol                 rol_miembro NOT NULL DEFAULT 'EMPLEADO',
    estado              estado_miembro NOT NULL DEFAULT 'INVITADO',
    fecha_ingreso       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (usuario_id, organizacion_id)
);

CREATE INDEX idx_miembros_organizacion_org ON miembros_organizacion (organizacion_id);
CREATE INDEX idx_miembros_organizacion_usuario ON miembros_organizacion (usuario_id);
CREATE INDEX idx_miembros_organizacion_estado ON miembros_organizacion (organizacion_id, estado);

-- =====================================================================
-- TABLA: invitaciones
-- =====================================================================

CREATE TABLE invitaciones (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id     UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    email               VARCHAR(255) NOT NULL,
    rol                 rol_miembro NOT NULL DEFAULT 'EMPLEADO',
    token               VARCHAR(255) NOT NULL UNIQUE,
    invitado_por        UUID NOT NULL REFERENCES usuarios(id),
    estado              estado_invitacion NOT NULL DEFAULT 'PENDIENTE',
    expira_en           TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invitaciones_org ON invitaciones (organizacion_id);
CREATE INDEX idx_invitaciones_email ON invitaciones (email);
CREATE INDEX idx_invitaciones_token ON invitaciones (token);

-- =====================================================================
-- TABLA: codigos_invitacion
-- Código genérico de invitación: no va ligado a un correo y lo puede usar
-- cualquier persona hasta que expire; quien lo use entra con `rol`.
-- La invitación personal (correo + rol) sigue en `invitaciones`.
-- =====================================================================

CREATE TABLE codigos_invitacion (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id     UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    codigo              VARCHAR(32) NOT NULL UNIQUE,
    rol                 rol_miembro NOT NULL DEFAULT 'EMPLEADO',
    creado_por          UUID NOT NULL REFERENCES usuarios(id),
    expira_en           TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_codigos_invitacion_org ON codigos_invitacion (organizacion_id);

-- =====================================================================
-- TABLA: codigos_qr (un QR por organización por día)
-- =====================================================================

CREATE TABLE codigos_qr (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id     UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    fecha               DATE NOT NULL,
    token               VARCHAR(255) NOT NULL UNIQUE,
    generado_por        UUID NOT NULL REFERENCES usuarios(id),
    expira_en           TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (organizacion_id, fecha)
);

CREATE INDEX idx_codigos_qr_org_fecha ON codigos_qr (organizacion_id, fecha);
CREATE INDEX idx_codigos_qr_token ON codigos_qr (token);

-- =====================================================================
-- TABLA: jornadas_asistencia
-- Representa la jornada de UN usuario en UNA fecha dentro de UNA
-- organización. `hora_inicio` es el primer escaneo del día;
-- `hora_fin` se actualiza con cada SALIDA registrada, de forma que
-- siempre refleja la ÚLTIMA salida (la salida "oficial" del día).
-- Entre `hora_inicio` y `hora_fin` puede haber puntos intermedios de
-- salida/retorno, registrados en `movimientos_asistencia`.
-- Este diseño cubre ambos casos de negocio:
--   (a) jornada simple: exactamente 1 ENTRADA + 1 SALIDA.
--   (b) jornada con movimientos intermedios: múltiples pares
--       ENTRADA/SALIDA, donde la última SALIDA define `hora_fin`.
-- =====================================================================

CREATE TABLE jornadas_asistencia (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id          UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    organizacion_id     UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    codigo_qr_id        UUID NOT NULL REFERENCES codigos_qr(id),
    fecha               DATE NOT NULL,
    hora_inicio         TIMESTAMPTZ NOT NULL,
    hora_fin            TIMESTAMPTZ,
    estado_actual       estado_jornada NOT NULL DEFAULT 'DENTRO',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (usuario_id, fecha),
    CONSTRAINT chk_hora_fin_posterior CHECK (hora_fin IS NULL OR hora_fin >= hora_inicio)
);

CREATE INDEX idx_jornadas_usuario_fecha ON jornadas_asistencia (usuario_id, fecha);
CREATE INDEX idx_jornadas_org_fecha ON jornadas_asistencia (organizacion_id, fecha);

-- =====================================================================
-- TABLA: movimientos_asistencia
-- Cada fila es un evento puntual de escaneo (ENTRADA) o confirmación
-- de salida (SALIDA) dentro de una jornada. La secuencia debe alternar
-- (ENTRADA, SALIDA, ENTRADA, SALIDA, ...); esta alternancia se valida
-- en la capa de aplicación usando `jornadas_asistencia.estado_actual`
-- (DENTRO exige que el siguiente movimiento sea SALIDA; FUERA exige
-- que el siguiente sea ENTRADA con nuevo escaneo de QR).
-- =====================================================================

CREATE TABLE movimientos_asistencia (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jornada_id          UUID NOT NULL REFERENCES jornadas_asistencia(id) ON DELETE CASCADE,
    tipo                tipo_movimiento_asistencia NOT NULL,
    hora                TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_movimientos_jornada_hora ON movimientos_asistencia (jornada_id, hora);

-- =====================================================================
-- TABLA: tareas
-- El campo `adjuntos` guarda el material gráfico/archivos de la tarea
-- embebido como JSONB (no como tabla relacional): se consulta siempre
-- junto con la tarea y no necesita joins ni filtros propios. Cada
-- elemento del arreglo tiene esta forma:
--   {
--     "id": "uuid generado por la aplicación",
--     "tipo": "IMAGEN" | "ARCHIVO",
--     "url": "secure_url devuelta por Cloudinary",
--     "cloudinaryPublicId": "usado por el backend para eliminar el asset",
--     "nombreArchivo": "...",
--     "tamanoBytes": number,
--     "orden": number,
--     "createdAt": "timestamp ISO"
--   }
-- Formato, tamaño (máximo 10 MB) y demás reglas se validan en el
-- servicio del backend antes de agregar el objeto a este arreglo; no
-- hay restricciones de este tipo a nivel de base de datos.
-- =====================================================================

CREATE TABLE tareas (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id     UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    titulo              VARCHAR(200) NOT NULL,
    descripcion         TEXT,
    enlace              TEXT,
    fecha_inicio        TIMESTAMPTZ NOT NULL,
    fecha_fin           TIMESTAMPTZ,
    creado_por          UUID NOT NULL REFERENCES usuarios(id),
    adjuntos            JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_fecha_fin_posterior CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE INDEX idx_tareas_org_fecha ON tareas (organizacion_id, fecha_inicio);

-- =====================================================================
-- TABLA: asignaciones_tarea (asignación automática por miembro)
-- =====================================================================

CREATE TABLE asignaciones_tarea (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarea_id            UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
    usuario_id          UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estado              estado_asignacion_tarea NOT NULL DEFAULT 'PENDIENTE',
    completado_en       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tarea_id, usuario_id)
);

CREATE INDEX idx_asignaciones_usuario ON asignaciones_tarea (usuario_id, estado);
CREATE INDEX idx_asignaciones_tarea ON asignaciones_tarea (tarea_id);

-- =====================================================================
-- TABLA: notificaciones
-- Representa el CONTENIDO de un evento de notificación, UNA sola vez,
-- sin importar a cuántos usuarios se les vaya a enviar.
-- =====================================================================

CREATE TABLE notificaciones (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id     UUID REFERENCES organizaciones(id) ON DELETE CASCADE,
    tipo                tipo_notificacion NOT NULL,
    titulo              VARCHAR(200) NOT NULL,
    contenido           TEXT,
    referencia_id       UUID,
    creado_por          UUID REFERENCES usuarios(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notificaciones_org ON notificaciones (organizacion_id, created_at DESC);

-- =====================================================================
-- TABLA: notificaciones_usuario
-- Relación notificación <-> destinatario. Una fila liviana por cada
-- usuario que debe recibir esa notificación, con su propio estado de
-- lectura.
-- =====================================================================

CREATE TABLE notificaciones_usuario (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notificacion_id     UUID NOT NULL REFERENCES notificaciones(id) ON DELETE CASCADE,
    usuario_id          UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    leida               BOOLEAN NOT NULL DEFAULT FALSE,
    leida_en            TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (notificacion_id, usuario_id)
);

CREATE INDEX idx_notificaciones_usuario_bandeja ON notificaciones_usuario (usuario_id, leida, created_at DESC);

-- =====================================================================
-- TABLA: push_tokens
-- Identificador de cada dispositivo/navegador del usuario para poder
-- enviarle notificaciones push. Un usuario puede tener varios (uno por
-- dispositivo). `activo` indica validez técnica del token, no si el
-- usuario está en línea.
-- =====================================================================

CREATE TABLE push_tokens (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id              UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    plataforma              plataforma_dispositivo NOT NULL,
    expo_push_token         TEXT,           -- usado cuando plataforma = ANDROID o IOS
    web_push_suscripcion    JSONB,          -- usado cuando plataforma = WEB: { endpoint, keys: { p256dh, auth } }
    activo                  BOOLEAN NOT NULL DEFAULT TRUE,
    ultima_vez_usado        TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_push_token_segun_plataforma CHECK (
        (plataforma IN ('ANDROID', 'IOS') AND expo_push_token IS NOT NULL AND web_push_suscripcion IS NULL)
        OR
        (plataforma = 'WEB' AND web_push_suscripcion IS NOT NULL AND expo_push_token IS NULL)
    )
);

CREATE UNIQUE INDEX uq_push_tokens_expo ON push_tokens (usuario_id, expo_push_token) WHERE expo_push_token IS NOT NULL;
CREATE INDEX idx_push_tokens_usuario ON push_tokens (usuario_id, activo);

-- =====================================================================
-- NOTA: no existe tabla de refresh_tokens.
-- La autenticación (credenciales + OAuth 2.0) se delega completamente
-- a Clerk, que gestiona sus propios tokens de sesión y su renovación
-- vía SDK (mobile y web). El backend solo verifica el JWT emitido por
-- Clerk en cada request, y se sincroniza con la tabla `usuarios`
-- mediante webhooks de Clerk (user.created / user.updated / user.deleted).
-- =====================================================================

-- =====================================================================
-- FIN DEL ESQUEMA
--
-- Lógica que NO vive en esta base de datos, por decisión de diseño
-- (reglas de negocio y automatismos se implementan en el backend
-- NestJS, no como funciones/triggers/vistas SQL):
--
-- 1. Actualización de `updated_at`: la gestiona Prisma (`@updatedAt`
--    en el modelo) al momento de cada UPDATE, no un trigger de
--    PostgreSQL. Las columnas `updated_at` existen en el esquema; lo
--    que no existe es la función/trigger que las mantenía.
--
-- 2. Cálculo de horas trabajadas: se calculaba antes con una vista
--    SQL (`vista_horas_trabajadas_diarias`) que emparejaba
--    ENTRADA/SALIDA con funciones de ventana (LAG). Esa regla de
--    negocio ahora vive en `ReportesService` (backend): se consultan
--    los `movimientos_asistencia` de una jornada ordenados por `hora`
--    y se suman los tramos ENTRADA→SALIDA en código de aplicación.
--    Motivo: la regla queda versionada, testeada y documentada junto
--    al resto de la lógica de negocio, en vez de oculta en SQL.
-- =====================================================================
