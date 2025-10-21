-- 🔁 Limpieza
DROP TABLE IF EXISTS carrito   CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS usuarios  CASCADE;

-- 👤 Usuarios
CREATE TABLE usuarios (
                          id         BIGSERIAL   PRIMARY KEY,
                          username   VARCHAR(60)  NOT NULL UNIQUE,
                          password   VARCHAR(100) NOT NULL,
                          rol        VARCHAR(20)  NOT NULL CHECK (rol IN ('USUARIO','ADMIN')),
                          enabled    BOOLEAN      NOT NULL DEFAULT TRUE,
                          created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 🍫 Productos
CREATE TABLE productos (
                           id          BIGSERIAL    PRIMARY KEY,
                           nombre      VARCHAR(120) NOT NULL,
                           tipo        VARCHAR(60)  NOT NULL,
                           pais_origen VARCHAR(60),
                           precio      INTEGER      NOT NULL CHECK (precio >= 0),
                           stock       INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),
                           created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_productos_tipo        ON productos (tipo);
CREATE INDEX idx_productos_pais_origen ON productos (pais_origen);

-- 🛒 Carrito
CREATE TABLE carrito (
                         id          BIGSERIAL   PRIMARY KEY,
                         username    VARCHAR(60) NOT NULL,
                         producto_id BIGINT      NOT NULL,
                         cantidad    INTEGER     NOT NULL CHECK (cantidad >= 1),
                         created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                         CONSTRAINT fk_carrito_user
                             FOREIGN KEY (username)   REFERENCES usuarios(username) ON DELETE CASCADE,
                         CONSTRAINT fk_carrito_producto
                             FOREIGN KEY (producto_id) REFERENCES productos(id)     ON DELETE CASCADE,
                         CONSTRAINT uq_carrito_user_producto UNIQUE (username, producto_id)
);
CREATE INDEX idx_carrito_username ON carrito (username);

-- 🔧 Trigger de "merge": si ya existe (username, producto_id), suma cantidad
CREATE OR REPLACE FUNCTION carrito_merge() RETURNS TRIGGER AS $$
BEGIN
UPDATE carrito
SET cantidad   = carrito.cantidad + NEW.cantidad,
    created_at = NOW()
WHERE username    = NEW.username
  AND producto_id = NEW.producto_id;

IF FOUND THEN
    -- Ya había fila: hicimos UPDATE y cancelamos el INSERT
    RETURN NULL;
ELSE
    -- No existía: continuamos con el INSERT normal
    RETURN NEW;
END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_carrito_merge ON carrito;
CREATE TRIGGER trg_carrito_merge
    BEFORE INSERT ON carrito
    FOR EACH ROW
    EXECUTE FUNCTION carrito_merge();

-- 🌱 Seed de Productos (igual que el tuyo)
INSERT INTO productos (nombre, tipo, pais_origen, precio, stock) VALUES
                                                                     ('Chocolate con almendras 70%',  'Chocolates',  'CO',  9800,  50),
                                                                     ('Gomitas ácidas surtidas',      'Gomitas',     'CO',  5900,  120),
                                                                     ('Caramelos de mantequilla',     'Caramelos',   'CO',  4500,  80),
                                                                     ('Galletas chispas chocolate',   'Galletas',    'CO',  8200,  60),
                                                                     ('Malvaviscos suaves',           'Confites',    'CO',  5400,  75),
                                                                     ('Bocadillo veleño',             'Colombianos', 'CO',  6500,  100),
                                                                     ('Cocadas artesanales',          'Colombianos', 'CO',  7200,  65),
                                                                     ('Chocolate blanco frutos rojos','Chocolates',  'CO',  10400, 40),
                                                                     ('Ositos de goma',               'Gomitas',     'CO',  5200,  140),
                                                                     ('Arequipe en cubos',            'Caramelos',   'CO',  7600,  55),
                                                                     ('Wafer de vainilla',            'Galletas',    'CO',  4300,  90),
                                                                     ('Malteada de chocolate',        'Bebidas',     'CO',  8900,  25);
