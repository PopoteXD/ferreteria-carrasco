# Ferretería Carrasco — Tienda web full stack

Tienda online para la ferretería: catálogo, carrito, ofertas, pedidos con descuento de stock, pagos simulados, contacto y panel de administración. Frontend React y backend con 5 microservicios Spring Boot, autenticación JWT con roles y base de datos MySQL.

Proyecto de la asignatura DSY1104 — Desarrollo Full Stack II (grupo 14).

## Arquitectura

```
                          ┌──────────────┐
  Navegador ─────────────►│   frontend   │  React 19 + Vite (nginx en producción)
                          └──────┬───────┘  puerto 80 / 5173 en desarrollo
                                 │  JWT en cada llamada
        ┌──────────┬─────────────┼──────────────┬─────────────┐
        ▼          ▼             ▼              ▼             ▼
  ms-productos ms-usuarios  ms-pedidos    ms-contacto     ms-pagos
     8081        8082         8083           8084           8085
        │                        │
        └────────────────────────┘
              ▼
     MySQL 8 (base "ferreteria", tablas por servicio)
```

| Servicio | Puerto | Responsabilidad | Tablas |
|---|---|---|---|
| ms-productos | 8081 | Productos, ofertas y stock | productos, ofertas |
| ms-usuarios | 8082 | Registro, login (JWT), usuarios, regiones/comunas | usuarios |
| ms-pedidos | 8083 | Pedidos y ventas; valida y descuenta stock en ms-productos | pedidos, lineas_pedido |
| ms-contacto | 8084 | Mensajes de contacto | mensajes_contacto |
| ms-pagos | 8085 | Pagos simulados (débito, transferencia, efectivo) | pagos |

Los 5 servicios firman y validan los JWT con la misma variable `JWT_SECRET` (HS256). El claim `rol` puede ser `ADMIN`, `CLIENTE` o `SERVICIO` (token interno que usa ms-pedidos para actualizar stock).

## Requisitos previos

- Java 25, Maven 3.9+
- Node 20+
- MySQL 8 (o Docker Desktop)
- Un archivo `.env` en la raíz (copiar desde `.env.example`)

## Cómo correr en local

**1. Configurar el frontend**

```bash
cp .env.example .env   # revisa las URLs VITE_* (por defecto apuntan a localhost)
npm install
npm run dev            # http://localhost:5173
```

Si alguna variable `VITE_*_API_URL` queda vacía, esa parte de la tienda funciona en modo local (datos del navegador), útil para desarrollar sin backend.

**2. Backend con H2 (sin instalar nada más)**

```bash
mvn -q spring-boot:run   # dentro de backend/ y de cada carpeta microservicios/ms-*
```

**3. Backend con MySQL**

1. Crea la base y el usuario: `mysql -u root -p < database/ferreteria.sql`
2. En cada servicio exporta `SPRING_PROFILES_ACTIVE=mysql`, `DB_URL`, `DB_USER`, `DB_PASSWORD` y el `JWT_SECRET`, y vuelve a levantarlo. Las tablas las crea Hibernate (`ddl-auto=update`).

## Cómo correr con Docker (todo junto)

```bash
cp .env.example .env   # define JWT_SECRET, DB_PASSWORD, DB_ROOT_PASSWORD, ADMIN_CLAVE
docker compose up -d --build
```

Queda levantado: MySQL + los 5 microservicios + el frontend en `http://localhost`.

## Seguridad

- Login y registro devuelven `{token, expiraEn, usuario}`; el frontend lo guarda y envía `Authorization: Bearer <token>`.
- Renovación: `POST /api/auth/refresh`; el frontend renueva el token antes de que expire y cierra la sesión ante un 401.
- Códigos HTTP: 401 sin token, 403 sin permisos (por ejemplo, un cliente llamando a rutas de administración), 400 con validaciones, 404 y 409 donde corresponde.
- Contraseñas con hash BCrypt. Los secretos (`JWT_SECRET`, claves de base de datos) viven solo en variables de entorno o `.env`, que no se sube al repositorio.
- Un usuario desactivado por el administrador no puede iniciar sesión.

## Endpoints principales

Cada servicio publica Swagger en `/swagger-ui.html`, por ejemplo <http://localhost:8082/swagger-ui.html>.

| Servicio | Endpoints |
|---|---|
| ms-productos | `GET /api/productos`, `POST/PUT/DELETE /api/productos/**` (ADMIN), `GET /api/ofertas/vigentes`, CRUD `/api/ofertas` (ADMIN), `GET /api/health` |
| ms-usuarios | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/usuarios` (ADMIN), `POST /api/usuarios` (ADMIN), `PUT /api/usuarios/{id}`, `PATCH /api/usuarios/{id}/estado` (ADMIN), `PATCH /api/usuarios/{id}/rol` (ADMIN), `DELETE /api/usuarios/{id}` (ADMIN), `GET /api/ubicaciones/**` |
| ms-pedidos | `GET/POST /api/pedidos`, `GET /api/pedidos?correo=`, `PATCH /api/pedidos/{id}/estado` (ADMIN), `GET /api/pedidos/resumen` (ADMIN) |
| ms-contacto | `POST /api/contacto` (público), el resto ADMIN |
| ms-pagos | `POST /api/pagos`, `PATCH /api/pagos/{id}/confirmar`, el resto ADMIN |

La colección de Postman está en `postman/`: al ejecutar *Iniciar sesión* guarda el token y lo usa en el resto de las peticiones.

## Credenciales de prueba

| Cuenta | Correo | Clave |
|---|---|---|
| Administrador propietario | `luis.ferreteria373@gmail.com` | valor de `ADMIN_CLAVE` (`admin123` solo en desarrollo) |

Esta cuenta es la propietaria: no se le puede cambiar el rol, desactivar ni eliminar. Créala cambiando `ADMIN_CORREO` y `ADMIN_CLAVE` en tu `.env` antes de publicar.

## Pruebas

| Suite | Comando | Alcance |
|---|---|---|
| Jasmine + Karma | `npm test` | Utilidades y manejo del token (24 tests). Reporte en `coverage-karma/index.html` |
| Vitest (componentes) | `npm run test:vitest` | Componentes React y contextos (164 tests) |
| Cobertura frontend | `npm test` (reporte) | Statements/branches/lines sobre utilidades y sesión |
| Backend JUnit | `mvn test` en cada servicio | 36 tests en total (11 usuarios, 10 productos, 6 pedidos, 5 contacto, 4 pagos) |

`npm run build` compila el frontend y `npm run lint` revisa el código.

## Base de datos

- Script de creación y usuario: `database/ferreteria.sql`
- Respaldo: `docker exec ferreteria-mysql mysqldump -u root -p"<CLAVE>" ferreteria > ferreteria-respaldo.sql`

## Despliegue en AWS EC2

Guía paso a paso en [DESPLIEGUE_AWS.md](DESPLIEGUE_AWS.md): instancia EC2 con Docker Compose (MySQL + 5 microservicios + frontend en nginx), grupos de seguridad, Elastic IP, respaldo y checklist para la demo.

## Estructura del repositorio

```
backend/            ms-productos
microservicios/     ms-usuarios, ms-pedidos, ms-contacto, ms-pagos
src/                frontend React (componentes, contextos, servicios, tests en ../tests)
spec/               tests Jasmine/Karma
database/           script SQL de la base
postman/            colecciones de Postman
docker-compose.yml  MySQL + 5 servicios + frontend
DESPLIEGUE_AWS.md   guía de despliegue en EC2
```
