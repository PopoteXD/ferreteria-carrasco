-- Base de datos de Ferretería Carrasco (MySQL 8).
-- Los 5 microservicios comparten la base "ferreteria"; las tablas las crea Hibernate
-- (spring.jpa.hibernate.ddl-auto=update) al iniciar cada servicio con SPRING_PROFILES_ACTIVE=mysql.
--
-- Uso:  mysql -u root -p < database/ferreteria.sql
-- Cambia la clave antes de ejecutar; no subas la clave real al repositorio.

CREATE DATABASE IF NOT EXISTS ferreteria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'ferreteria'@'%' IDENTIFIED BY 'CAMBIA_ESTA_CLAVE';
GRANT ALL PRIVILEGES ON ferreteria.* TO 'ferreteria'@'%';
FLUSH PRIVILEGES;

-- Tablas generadas por los servicios:
--   ms-productos: productos, ofertas
--   ms-usuarios : usuarios (clave_hash BCrypt, tipo_usuario, activo)
--   ms-pedidos  : pedidos, lineas_pedido
--   ms-pagos    : pagos
--   ms-contacto : mensajes_contacto
--
-- Respaldo con datos (después de iniciar los servicios al menos una vez):
--   mysqldump -u ferreteria -p ferreteria > database/ferreteria-respaldo.sql
