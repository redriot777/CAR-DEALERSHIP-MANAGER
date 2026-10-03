const express = require('express');
const router = express.Router();
const pool = require('../db');

// ─── Helper: Validate car input ──────────────────────────────────────────────
function validateCarInput(body) {
    const errors = [];
    const { brand, model, year, price, fuel_type, transmission, mileage } = body;

    if (!brand || brand.trim() === '') errors.push('Brand is required.');
    if (!model || model.trim() === '') errors.push('Model is required.');

    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year);
    if (!year || isNaN(yearNum) || yearNum < 1886 || yearNum > currentYear + 2) {
        errors.push(`Year must be a valid year between 1886 and ${currentYear + 2}.`);
    }

    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
        errors.push('Price must be a positive number.');
    }

    if (!fuel_type || fuel_type.trim() === '') errors.push('Fuel Type is required.');
    if (!transmission || transmission.trim() === '') errors.push('Transmission is required.');

    if (mileage !== undefined && mileage !== '' && mileage !== null) {
        const mileageNum = parseInt(mileage);
        if (isNaN(mileageNum) || mileageNum < 0) {
            errors.push('Mileage cannot be negative.');
        }
    }

    return errors;
}

// ─── GET /api/cars — Get all cars ────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM cars ORDER BY created_at DESC'
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('GET /api/cars error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve cars. Database may be unavailable.',
            error: err.message
        });
    }
});

// ─── GET /api/cars/:id — Get single car ──────────────────────────────────────
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM cars WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Car not found.' });
        }
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(`GET /api/cars/${id} error:`, err.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve car.',
            error: err.message
        });
    }
});

// ─── POST /api/cars — Create new car ─────────────────────────────────────────
router.post('/', async (req, res) => {
    const errors = validateCarInput(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: errors.join(' '), errors });
    }

    const {
        brand, model, year, price,
        fuel_type, transmission, color,
        mileage, availability
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO cars (brand, model, year, price, fuel_type, transmission, color, mileage, availability)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                brand.trim(),
                model.trim(),
                parseInt(year),
                parseFloat(price),
                fuel_type.trim(),
                transmission.trim(),
                color ? color.trim() : null,
                mileage !== '' && mileage !== null && mileage !== undefined ? parseInt(mileage) : null,
                availability !== undefined ? availability : true
            ]
        );
        res.status(201).json({ success: true, data: result.rows[0], message: 'Car added successfully.' });
    } catch (err) {
        console.error('POST /api/cars error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Failed to add car.',
            error: err.message
        });
    }
});

// ─── PUT /api/cars/:id — Update a car ────────────────────────────────────────
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const errors = validateCarInput(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: errors.join(' '), errors });
    }

    const {
        brand, model, year, price,
        fuel_type, transmission, color,
        mileage, availability
    } = req.body;

    try {
        const result = await pool.query(
            `UPDATE cars
             SET brand = $1, model = $2, year = $3, price = $4,
                 fuel_type = $5, transmission = $6, color = $7,
                 mileage = $8, availability = $9
             WHERE id = $10
             RETURNING *`,
            [
                brand.trim(),
                model.trim(),
                parseInt(year),
                parseFloat(price),
                fuel_type.trim(),
                transmission.trim(),
                color ? color.trim() : null,
                mileage !== '' && mileage !== null && mileage !== undefined ? parseInt(mileage) : null,
                availability !== undefined ? availability : true,
                id
            ]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Car not found.' });
        }
        res.status(200).json({ success: true, data: result.rows[0], message: 'Car updated successfully.' });
    } catch (err) {
        console.error(`PUT /api/cars/${id} error:`, err.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update car.',
            error: err.message
        });
    }
});

// ─── DELETE /api/cars/:id — Delete a car ─────────────────────────────────────
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM cars WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Car not found.' });
        }
        res.status(200).json({ success: true, data: result.rows[0], message: 'Car deleted successfully.' });
    } catch (err) {
        console.error(`DELETE /api/cars/${id} error:`, err.message);
        res.status(500).json({
            success: false,
            message: 'Failed to delete car.',
            error: err.message
        });
    }
});

module.exports = router;
