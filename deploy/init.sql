-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
                                        id BIGSERIAL PRIMARY KEY,
                                        username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'USUARIO',  -- 'ADMIN' | 'USUARIO'
    enabled BOOLEAN NOT NULL DEFAULT TRUE
    );

-- Productos
CREATE TABLE IF NOT EXISTS productos (
                                         id BIGSERIAL PRIMARY KEY,
                                         nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(60) NOT NULL,
    pais_origen VARCHAR(60),
    precio NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0
    );

-- Carrito
CREATE TABLE IF NOT EXISTS carrito (
                                       id BIGSERIAL PRIMARY KEY,
                                       usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    UNIQUE (usuario_id, producto_id)
    );

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_productos_tipo ON productos(tipo);
CREATE INDEX IF NOT EXISTS idx_productos_pais ON productos(pais_origen);
CREATE INDEX IF NOT EXISTS idx_carrito_usuario ON carrito(usuario_id);

-- Semillas opcionales
INSERT INTO productos (nombre, tipo, pais_origen, precio, stock) VALUES
                                                                     ('Chocoteja Clásica', 'Chocolates', 'PE', 6500, 30),
                                                                     ('Gomitas Ácidas', 'Gomitas', 'CO', 4200, 50),
                                                                     ('Caramelos de Menta', 'Caramelos', 'AR', 2800, 100)
    ON CONFLICT DO NOTHING;
