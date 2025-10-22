-- ===========================
-- DulceMarket – Inicialización completa
-- Base de datos: usar con POSTGRES_DB=dulcesdb
-- ===========================

-- Extensiones útiles
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- para BCrypt (crypt(..., gen_salt('bf')))

-- Limpieza idempotente
DROP TABLE IF EXISTS carrito   CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS usuarios  CASCADE;

-- ===========================
-- 👤 Tabla: usuarios
-- ===========================
CREATE TABLE usuarios (
                          id         BIGSERIAL     PRIMARY KEY,
                          username   VARCHAR(60)   NOT NULL UNIQUE,
                          password   VARCHAR(100)  NOT NULL,
                          rol        VARCHAR(20)   NOT NULL CHECK (rol IN ('USUARIO','ADMIN')),
                          enabled    BOOLEAN       NOT NULL DEFAULT TRUE,
                          created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ===========================
-- 🍫 Tabla: productos
-- ===========================
CREATE TABLE productos (
                           id          BIGSERIAL     PRIMARY KEY,
                           nombre      VARCHAR(120)  NOT NULL,
                           tipo        VARCHAR(60)   NOT NULL,
                           pais_origen VARCHAR(60),
                           precio      INTEGER       NOT NULL CHECK (precio >= 0),
                           stock       INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
                           created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_productos_tipo        ON productos (tipo);
CREATE INDEX idx_productos_pais_origen ON productos (pais_origen);

-- ===========================
-- 🛒 Tabla: carrito
-- ===========================
CREATE TABLE carrito (
                         id          BIGSERIAL   PRIMARY KEY,
                         username    VARCHAR(60) NOT NULL,
                         producto_id BIGINT      NOT NULL,
                         cantidad    INTEGER     NOT NULL CHECK (cantidad >= 1),
                         created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                         CONSTRAINT fk_carrito_user
                             FOREIGN KEY (username)    REFERENCES usuarios(username) ON DELETE CASCADE,
                         CONSTRAINT fk_carrito_producto
                             FOREIGN KEY (producto_id) REFERENCES productos(id)      ON DELETE CASCADE,
                         CONSTRAINT uq_carrito_user_producto UNIQUE (username, producto_id)
);

CREATE INDEX idx_carrito_username ON carrito (username);

-- ===========================
-- 🌱 Seed: usuarios
-- (Passwords con BCrypt usando pgcrypto)
-- ===========================
INSERT INTO usuarios (username, password, rol, enabled) VALUES
                                                            ('admin',   crypt('admin',   gen_salt('bf')), 'ADMIN',   TRUE),
                                                            ('juan456', crypt('juan456', gen_salt('bf')), 'USUARIO', TRUE);

-- ===========================
-- 🌱 Seed: productos
-- (coherentes con tu frontend)
-- ===========================
INSERT INTO productos (nombre, tipo, pais_origen, precio, stock) VALUES
                                                                     ('Ramune Original',                 'Bebidas',     'Japón',    9800,  40),
                                                                     ('Ramune Melón',                    'Bebidas',     'Japón',    9800,  35),
                                                                     ('Jarritos Tamarindo',              'Bebidas',     'México',   7800,  50),
                                                                     ('Inca Kola',                       'Bebidas',     'Perú',     6500,  60),
                                                                     ('Pocky Chocolate',                 'Dulces',      'Japón',    5500,  80),
                                                                     ('Pocky Fresa',                     'Dulces',      'Japón',    5500,  70),
                                                                     ('Pepero Almond',                   'Dulces',      'Corea',    5700,  60),
                                                                     ('Mochi Matcha',                    'Dulces',      'Japón',   12000,  30),
                                                                     ('Haribo Goldbears',                'Dulces',      'Alemania', 5200,  90),
                                                                     ('Skittles Original',               'Dulces',      'EE.UU.',   4800, 100),
                                                                     ('KitKat Matcha',                   'Chocolates',  'Japón',    8200,  55),
                                                                     ('Milka Oreo',                      'Chocolates',  'Suiza',    7800,  40),
                                                                     ('Kinder Bueno',                    'Chocolates',  'Italia',   6900,  65),
                                                                     ('Ferrero Rocher 3u',               'Chocolates',  'Italia',   9500,  50),
                                                                     ('M&M''s Peanut',                   'Chocolates',  'EE.UU.',   6800,  70),
                                                                     ('Tortuguita Leche',                'Chocolates',  'Brasil',   5200,  85),
                                                                     ('Oreo Matcha',                     'Galletas',    'China',    5400,  55),
                                                                     ('Lotte Choco Pie',                 'Galletas',    'Corea',    6000,  50),
                                                                     ('Takis Fuego',                     'Snacks',      'México',   6500,  70),
                                                                     ('Cheetos Flamin'' Hot',            'Snacks',      'EE.UU.',   6000,  75),
                                                                     ('Lays Jamón Serrano',              'Snacks',      'España',   5800,  50),
                                                                     ('Pretz Pizza',                     'Snacks',      'Japón',    5600,  40),
                                                                     ('Chocoramo Clásico',               'Pastelería',  'Colombia', 4200, 120),
                                                                     ('Ponqué Gala',                     'Pastelería',  'Colombia', 3800, 110),
                                                                     ('Chocman',                         'Pastelería',  'Perú',     3900,  90),
                                                                     ('Chocolate con almendras 70%',     'Chocolates',  'CO',       9800,  50),
                                                                     ('Gomitas ácidas surtidas',         'Gomitas',     'CO',       5900, 120),
                                                                     ('Caramelos de mantequilla',        'Caramelos',   'CO',       4500,  80),
                                                                     ('Galletas chispas chocolate',      'Galletas',    'CO',       8200,  60),
                                                                     ('Malvaviscos suaves',              'Confites',    'CO',       5400,  75),
                                                                     ('Bocadillo veleño',                'Colombianos', 'CO',       6500, 100),
                                                                     ('Cocadas artesanales',             'Colombianos', 'CO',       7200,  65),
                                                                     ('Chocolate blanco frutos rojos',   'Chocolates',  'CO',      10400,  40),
                                                                     ('Ositos de goma',                  'Gomitas',     'CO',       5200, 140),
                                                                     ('Arequipe en cubos',               'Caramelos',   'CO',       7600,  55),
                                                                     ('Wafer de vainilla',               'Galletas',    'CO',       4300,  90),
                                                                     ('Malteada de chocolate',           'Bebidas',     'CO',       8900,  25);

-- ===========================
-- FIN
-- ===========================
