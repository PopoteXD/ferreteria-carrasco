# Despliegue en AWS EC2 (AWS Academy) con Docker Compose

Guía completa: instancia EC2 + Elastic IP + dominio DuckDNS + todo el stack con un comando (MySQL + 5 microservicios + frontend nginx).

> **REGLA DE ORO del laboratorio AWS Academy:**
> - **Start Lab / End Lab**: enciende y apaga la sesión. Tus recursos **se conservan**.
> - **Reset**: **BORRA TODO** lo que hay en la cuenta (instancias, discos, IPs). No se puede deshacer.
> - Para recargar la página del navegador usa **F5**, nunca Reset.
> - Al hacer End Lab la instancia se detiene; al volver a hacer Start Lab, **enciende la instancia** desde la consola EC2 y los contenedores arrancan solos (`restart: unless-stopped`).

## Parte A — Crear la instancia

1. AWS Academy → Learner Lab → **Start Lab** → espera el círculo verde → botón **AWS**.
2. Consola AWS → **EC2** → **Lanzar instancias**:

| Campo | Valor |
|---|---|
| Name | ferreteria-carrasco |
| AMI | **Amazon Linux 2023** |
| Tipo | **t3.medium** (4 GB). t2.micro NO alcanza para 5 Java + MySQL |
| Key pair | **vockey** |
| Almacenamiento | 20 GB gp3 |

3. Grupo de seguridad (reglas de entrada):

| Tipo | Puerto | Origen |
|---|---|---|
| SSH | 22 | **My IP** (solo tu PC) |
| HTTP | 80 | Anywhere `0.0.0.0/0` |
| TCP personalizado | 8081-8085 | Opcional (solo para Swagger/Postman directo); la web ya no los necesita |
| MySQL 3306 | **NUNCA abrir** | la base solo vive dentro de Docker |

4. Lanza la instancia.

## Parte B — Elastic IP (IP fija, imprescindible)

Sin esto, la IP pública cambia cada vez que detienes/inicias la instancia o el lab, y el enlace de la demo muere.

1. EC2 → menú izquierdo → **Direcciones IP elásticas** → **Asignar dirección IP elástica** → **Asignar**.
2. Selecciónala → **Acciones → Asociar dirección IP elástica** → tipo instancia → elige `ferreteria-carrasco` → **Asociar**.
3. Anótala: es `TU_IP` para toda esta guía. Guárdala también en tu PC (notas o gestor de claves).

## Parte C — Conectarse e instalar Docker

Conecta con **Conectar → EC2 Instance Connect** (usuario `ec2-user`). Pega y ejecuta:

```bash
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

**Cierra la pestaña, vuelve a conectar** (para que aplique el grupo docker) y verifica:

```bash
docker --version && docker compose version
```

## Parte D — Clonar el proyecto y configurar secretos

```bash
git clone https://github.com/PopoteXD/Ferreteria-Carrasco.git
cd Ferreteria-Carrasco
cp .env.example .env
openssl rand -base64 48      # copia la salida: será el JWT_SECRET (no la compartas ni la fotografíes)
nano .env
```

Edita en `nano` (flechas para moverte, Ctrl+Shift+V o clic derecho para pegar). **Las 6 URLs son IGUALES: la dirección de la web, sin puerto.** nginx (puerto 80) reenvía `/api/...` a cada microservicio, así el celular solo necesita el puerto 80 (muchas redes móviles bloquean 8081-8085):

```
FRONTEND_ORIGIN=http://TU_DOMINIO_O_IP
VITE_API_BASE_URL=http://TU_DOMINIO_O_IP
VITE_USUARIOS_API_URL=http://TU_DOMINIO_O_IP
VITE_PEDIDOS_API_URL=http://TU_DOMINIO_O_IP
VITE_CONTACTO_API_URL=http://TU_DOMINIO_O_IP
VITE_PAGOS_API_URL=http://TU_DOMINIO_O_IP
JWT_SECRET=<el valor de openssl>
DB_PASSWORD=<clave propia, sin $ ni comillas>
DB_ROOT_PASSWORD=<otra clave propia>
ADMIN_CLAVE=<la clave real del administrador>
VITE_ADMIN_CLAVE=            <- déjala VACÍA (se incrusta en el código público)
```

`TU_DOMINIO_O_IP` es, por ejemplo, `ferreteriacarrasco.duckdns.org` (o tu Elastic IP). Sin barra final, sin puerto, con `http://`.

Guarda con **Ctrl+O, Enter** y sal con **Ctrl+X**. Valida sin mostrar secretos:

```bash
for nombre in FRONTEND_ORIGIN VITE_API_BASE_URL VITE_USUARIOS_API_URL VITE_PEDIDOS_API_URL VITE_CONTACTO_API_URL VITE_PAGOS_API_URL JWT_SECRET DB_PASSWORD DB_ROOT_PASSWORD ADMIN_CLAVE; do
  valor=$(grep -E "^${nombre}=" .env | tail -n 1 | cut -d= -f2-)
  if [ -z "$valor" ]; then echo "$nombre: FALTA"
  elif [ "$nombre" = "JWT_SECRET" ] && [ "${#valor}" -lt 32 ]; then echo "$nombre: demasiado corto"
  elif printf '%s' "$valor" | grep -qiE 'pon-aqui|pon-una-clave|cambia-esta-clave|cambia-la-clave'; then echo "$nombre: valor de ejemplo"
  else echo "$nombre: definida"; fi
done
```

Todo debe decir `definida`.

## Parte E — Levantar todo

```bash
docker compose --parallel 1 up -d --build
docker compose ps
```

La primera vez tarda varios minutos (Maven compila los 5 servicios). Si la instancia se cuelga por memoria, construye por partes: `docker compose build ms-productos`, luego los otros, y al final `docker compose up -d`.

## Parte F — Verificar

- Web: `http://TU_IP`
- Salud por el puerto 80: `http://TU_IP/api/health`; directo a cada servicio: `http://TU_IP:8081/api/health` (… 8085)
- Swagger: `http://TU_IP:8082/swagger-ui.html`
- Login admin: `ADMIN_CORREO` + la clave que pusiste en `ADMIN_CLAVE`.
- **Demo completa**: compra como cliente, admin CRUD productos/usuarios/pedidos.
- **Postman**: cambia las variables de la colección a `http://TU_IP:808x`. Comprueba 401 sin token, 403 con token de cliente en ruta admin, 200/201/400/404 en el CRUD. Toma capturas para la entrega.
- Prueba también desde el celular (datos móviles).

## Parte G — Respaldo de la base de datos (entregable .sql)

```bash
docker exec ferreteria-mysql mysqldump -u root -p"LA_CLAVE_ROOT" ferreteria > respaldo-ferreteria.sql
```

Descárgalo a tu PC (botón de descarga del archivo en EC2 Instance Connect o `scp -i labsuser.pem ec2-user@TU_IP:~/Ferreteria-Carrasco/respaldo-ferreteria.sql .`) y guárdalo en `database/` del proyecto. Haz uno nuevo después de cada carga de datos importante.

Restaurar un respaldo (si algún día se pierde todo):

```bash
docker exec -i ferreteria-mysql mysql -u root -p"LA_CLAVE_ROOT" ferreteria < respaldo-ferreteria.sql
```

## Parte H — Dominio con nombre: ferreteriacarrasco.duckdns.org

Reemplaza la IP por un nombre. Gratis. **Requiere la Elastic IP de la Parte B.**

1. Entra a <https://www.duckdns.org> e inicia sesión (Google o GitHub).
2. En el campo "add domain" escribe `ferreteriacarrasco` → **add domain**.
3. En la fila del dominio, reemplaza la IP que detecta por tu **Elastic IP** → **update ip**.
4. En la EC2, actualiza el `.env`:

```bash
cd ~/Ferreteria-Carrasco
sed -i -E 's#^(FRONTEND_ORIGIN|VITE_[A-Z_]*URL)=.*#\1=http://ferreteriacarrasco.duckdns.org#' .env
grep -E '^(FRONTEND_ORIGIN|VITE_.*URL)=' .env
```

Las seis líneas deben quedar exactamente `http://ferreteriacarrasco.duckdns.org` (sin puertos).

5. Recrea los servicios y reconstruye el frontend:

```bash
docker compose up -d --force-recreate ms-productos ms-usuarios ms-pedidos ms-contacto ms-pagos
docker compose build frontend
docker compose up -d --no-deps frontend
```

6. Prueba `http://ferreteriacarrasco.duckdns.org` en el navegador y el celular.

**Límite:** queda en `http://`, no `https://`. HTTPS necesita certificado y proxy inverso (opcional para esta entrega). Si DuckDNS te devuelve "KO" al actualizar la IP, revisa que pusiste la Elastic IP correcta.

## Parte I — Actualizar tras un cambio de código (en tu PC + EC2)

```bash
# PC
git add . && git commit -m "mensaje" && git push
# EC2
cd ~/Ferreteria-Carrasco && git pull
docker compose build frontend && docker compose up -d --no-deps frontend   # solo si cambió el frontend
docker compose up -d --build ms-usuarios    # o el servicio que cambió
```

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| Web no carga desde el celular, sí desde el PC | Brave/Chrome fuerza HTTPS (puerto 443 cerrado): desactiva "Actualizar conexiones a HTTPS" o usa otro navegador; prueba datos móviles |
| La página carga pero sin productos ni login | CORS: revisa `FRONTEND_ORIGIN` y las `VITE_*` en `.env` (IP completa, sin https ni barra final) → force-recreate + rebuild |
| Una variable dice FALTA o valor de ejemplo | Edita `.env` y vuelve a crear los contenedores |
| Contenedor reiniciando | `docker compose logs <servicio>` (clave de BD o JWT_SECRET ausente) |
| No conecta desde fuera | Security Group sin el puerto abierto |
| La IP cambió y nada funciona | Asocia la Elastic IP (Parte B) y actualiza el `.env` + rebuild |
| Perdí todo (Reset / lab reiniciado) | Repite Partes A-G desde GitHub; restaura el respaldo `.sql` en la Parte G |
| Disco lleno | `docker system prune -af` |
| Instancia lenta o colgada | usa t3.medium o agrega swap: `sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
