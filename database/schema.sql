-- ============================================================
--  Car Dealership Management - PostgreSQL Database Schema
-- ============================================================

-- Step 1: Create the database (run this as a superuser in psql)
-- CREATE DATABASE car_dealership;

-- Step 2: Connect to the database
-- \c car_dealership

-- Step 3: Create the cars table
CREATE TABLE IF NOT EXISTS cars (
    id            SERIAL PRIMARY KEY,
    brand         VARCHAR(100)   NOT NULL,
    model         VARCHAR(100)   NOT NULL,
    year          INTEGER        NOT NULL,
    price         NUMERIC(12, 2) NOT NULL,
    fuel_type     VARCHAR(50)    NOT NULL,
    transmission  VARCHAR(50)    NOT NULL,
    color         VARCHAR(50),
    mileage       INTEGER,
    availability  BOOLEAN        DEFAULT TRUE,
    created_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- ─── Sample Data ─────────────────────────────────────────────────────────────
-- These are sample records for testing purposes only.
-- The application primarily works with actual PostgreSQL data.

INSERT INTO cars (brand, model, year, price, fuel_type, transmission, color, mileage, availability) VALUES
    ('BMW',          'X5',        2025, 8500000.00, 'Petrol',  'Automatic', 'Black',        12000, TRUE),
    ('Audi',         'A4',        2024, 5200000.00, 'Diesel',  'Automatic', 'White',        25000, TRUE),
    ('Mercedes-Benz','C-Class',   2024, 6800000.00, 'Petrol',  'Automatic', 'Silver',        8000, TRUE),
    ('Toyota',       'Fortuner',  2023, 3800000.00, 'Diesel',  'Automatic', 'Pearl White',  45000, FALSE),
    ('Hyundai',      'Creta',     2025, 1650000.00, 'Petrol',  'Manual',    'Red',           5000, TRUE)
ON CONFLICT DO NOTHING;
