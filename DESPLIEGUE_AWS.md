# Despliegue en AWS EC2 (AWS Academy) con Docker Compose

Se levanta todo con un solo comando: MySQL + 5 microservicios + frontend (nginx).

## 0. Antes de empezar (en tu PC)

1. Sube el proyecto a GitHub (repo privado o público). **Nunca subas `.env`** (ya está en `.gitignore`).
2. Entra al laboratorio: AWS Academy -> Learner Lab -> **Start Lab** -> espera el círculo verde -> **AWS**.
3. En el Learner Lab descarga la llave: **AWS Details -> Download PEM** (`labsuser.pem`).

## 1. Crear la instancia EC2

El lab permite t2/t3 hasta *large*. **No uses t2.micro**: 1 GB de RAM no alcanza para 5 Java + MySQL.

| Campo | Valor |
|---|---|
| Name | ferreteria-carrasco |
| AMI | Amazon Linux 2023 |
| Tipo | **t3.medium** (4 GB). Mínimo aceptable: t3.small (2 GB) + swap |
| Key pair | vockey |
| Almacenamiento | 20 GB gp3 |

Security Group (reglas de entrada):

| Tipo | Puerto | Origen |
|---|---|---|
| SSH | 22 | My IP |
| HTTP | 80 | Anywhere (0.0.0.0/0) |
| TCP personalizado | 8081-8085 | Anywhere (el navegador llama directo a las APIs) |
| MySQL 3306 | **NO abrir** | la base solo se usa dentro de Docker |

Luego: **EC2 -> Elastic IPs -> Allocate -> Associate** a la instancia. Anota `<IP>`.
(Si no asocias Elastic IP, la IP cambia cada vez que reinicias el lab.)

## 2. Conectarte e instalar Docker

```bash
chmod 400 labsuser.pem
ssh -i labsuser.pem ec2-user@<IP>
```

Dentro de la EC2:

```bash
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64" -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
exit
```

Vuelve a entrar por SSH y verifica: `docker --version && docker compose version`.

Solo si usas t3.small, agrega swap de 2 GB:

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
```

## 3. Clonar y configurar secretos (solo en la EC2)

```bash
git clone https://github.com/<TU_USUARIO>/<TU_REPO>.git
cd <TU_REPO>
cp .env.example .env
nano .env
```

Edita en `.env` (usa valores propios, no los de ejemplo):

```
FRONTEND_ORIGIN=http://<IP>
VITE_API_BASE_URL=http://<IP>:8081
VITE_USUARIOS_API_URL=http://<IP>:8082
VITE_PEDIDOS_API_URL=http://<IP>:8083
VITE_CONTACTO_API_URL=http://<IP>:8084
VITE_PAGOS_API_URL=http://<IP>:8085
JWT_SECRET=<salida de: openssl rand -base64 48>
DB_PASSWORD=<clave propia>
DB_ROOT_PASSWORD=<clave propia>
ADMIN_CORREO=luis.ferreteria373@gmail.com
ADMIN_CLAVE=<clave del administrador>
```

`VITE_*` se incorporan al compilar el frontend: si cambias la IP, hay que reconstruir.

## 4. Levantar

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f ms-usuarios
```

El primer build tarda varios minutos (Maven descarga dependencias). Si la instancia se cuelga, construye por partes:
`docker compose build ms-productos`, luego `ms-usuarios`, etc., y al final `docker compose up -d`.

## 5. Verificar

- Frontend: `http://<IP>`
- Salud de APIs: `http://<IP>:8081/api/health` ... `:8085/api/health`
- Swagger: `http://<IP>:8082/swagger-ui.html` (y 8081, 8083, 8084, 8085)
- Login: correo `ADMIN_CORREO` con la clave `ADMIN_CLAVE`.
- Postman: en la colección cambia las variables `productos`, `usuarios`, ... a `http://<IP>:808x`, ejecuta *Iniciar sesión* (guarda el token) y prueba el CRUD.
  Debes comprobar: sin token = 401, token de cliente en ruta admin = 403.
- Prueba desde otra red (celular con datos) antes de la presentación.

## 6. Respaldo de la base (entregable `.sql`)

```bash
docker exec ferreteria-mysql mysqldump -u root -p"<DB_ROOT_PASSWORD>" ferreteria > ferreteria-respaldo.sql
scp -i labsuser.pem ec2-user@<IP>:~/<TU_REPO>/ferreteria-respaldo.sql .
```

## 7. Actualizar tras un cambio

```bash
cd <TU_REPO> && git pull && docker compose up -d --build
```

## 8. Antes de la presentación (24 de noviembre)

- El lab se apaga solo (sesión de ~4 h) y **al reiniciarlo la instancia queda detenida**: inicia el lab y arranca la instancia 30 min antes; los contenedores tienen `restart: unless-stopped` y vuelven solos. La Elastic IP se mantiene.
- Revisa `docker compose ps` (todo *Up*) y entra al frontend desde otro dispositivo.
- Ten a mano las URLs públicas del frontend y del backend (Swagger), el repo de GitHub y la colección de Postman.

## Problemas frecuentes

| Síntoma | Qué revisar |
|---|---|
| El frontend carga pero el login falla | `FRONTEND_ORIGIN` y `VITE_*` con la IP correcta; reconstruir con `docker compose up -d --build frontend` |
| `JWT_SECRET` requerido al hacer `up` | falta la variable en `.env` |
| Contenedor reiniciándose | `docker compose logs <servicio>` (clave de BD o puerto) |
| Instancia sin respuesta / OOM | usa t3.medium o agrega swap |
| No conecta desde fuera | Security Group (80 y 8081-8085) |
| Disco lleno | `docker system prune -af` |
