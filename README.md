# 🚗 Car Dealership Management System

A full-stack, PostgreSQL-backed web application for managing a car dealership's inventory. Built with Node.js, Express, and Vanilla JavaScript.

---

## 📋 Table of Contents

1. [Project Description](#project-description)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Project Structure](#project-structure)
8. [PostgreSQL Setup](#postgresql-setup)
9. [Environment Variables](#environment-variables)
10. [Installation](#installation)
11. [Running the Application](#running-the-application)
12. [CRUD Workflow](#crud-workflow)
13. [Troubleshooting](#troubleshooting)

---

## Project Description

A professional car dealership inventory management system with a premium dark dashboard UI. Supports complete CRUD operations against a live PostgreSQL database with zero page refreshes — every add, edit, and delete instantly reflects in both the frontend and the database.

---

## Features

- ✅ **Add** new cars to the dealership inventory
- ✅ **View** all cars with a detailed modal popup
- ✅ **Edit** existing car records inline (no page reload)
- ✅ **Delete** cars with a confirmation dialog
- ✅ **Dashboard statistics** — Total Cars, Available, Sold, Inventory Value
- ✅ **Real-time search** by brand, model, fuel type, transmission
- ✅ **Filters** for fuel type, transmission, availability
- ✅ **Toast notifications** for every operation
- ✅ **Full validation** on both frontend and backend
- ✅ **Parameterized SQL queries** (SQL injection prevention)
- ✅ **Responsive** layout for all screen sizes
- ✅ **Premium dark dashboard** aesthetic

---

## Technology Stack

| Layer    | Technology         |
|----------|--------------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend  | Node.js, Express.js |
| Database | PostgreSQL          |
| Driver   | `pg` (node-postgres) |
| Config   | `dotenv`            |
| CORS     | `cors`              |

---

## Architecture

```
Frontend (HTML/CSS/JS)
        │
        │  Fetch API (HTTP)
        ▼
  Express.js REST API  (localhost:5000)
        │
        │  pg (node-postgres)
        ▼
     PostgreSQL
        │
     cars table
```

---

## Database Schema

```sql
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
```

---

## API Endpoints

| Method | Endpoint         | Description        |
|--------|------------------|--------------------|
| GET    | `/api/cars`      | Get all cars       |
| GET    | `/api/cars/:id`  | Get one car by ID  |
| POST   | `/api/cars`      | Create a new car   |
| PUT    | `/api/cars/:id`  | Update a car       |
| DELETE | `/api/cars/:id`  | Delete a car       |
| GET    | `/api/health`    | Health check       |

---

## Project Structure

```
CAR DEALERSHIP MANAGEMENT/
├── backend/
│   ├── server.js          # Express app entry point
│   ├── db.js              # PostgreSQL connection pool
│   ├── routes/
│   │   └── cars.js        # All CRUD route handlers
│   ├── package.json
│   └── .env               # Environment variables (not committed)
├── frontend/
│   ├── index.html         # Single-page application
│   ├── style.css          # Premium dark dashboard styles
│   └── script.js          # All JS logic (Fetch, modals, stats)
├── database/
│   └── schema.sql         # Table creation + sample data
└── README.md
```

---

## PostgreSQL Setup

### Step 1 — Install PostgreSQL

Download from: https://www.postgresql.org/download/windows/

During installation, note your **postgres user password**.

### Step 2 — Create the Database

Open **psql** or **pgAdmin** and run:

```sql
CREATE DATABASE car_dealership;
```

### Step 3 — Create the Table

Connect to the new database:

```bash
psql -U postgres -d car_dealership
```

Then run the schema file:

```bash
psql -U postgres -d car_dealership -f database/schema.sql
```

Or paste the contents of `database/schema.sql` into pgAdmin's Query Tool.

---

## Environment Variables

Open `backend/.env` and update with your PostgreSQL credentials:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=car_dealership
DB_PASSWORD=YOUR_ACTUAL_PASSWORD
DB_PORT=5432
PORT=5000
```

> ⚠️ **Never** share or commit the `.env` file.

---

## Installation

```bash
cd backend
npm install
```

---

## Running the Application

### Start the Backend

```bash
cd backend
node server.js
```

Expected output:
```
✅ Connected to PostgreSQL database: car_dealership
════════════════════════════════════════
  🚗 Car Dealership Management API
  🌐 Server running on http://localhost:5000
  📋 API Base: http://localhost:5000/api/cars
════════════════════════════════════════
```

### Open the Frontend

Open `frontend/index.html` directly in your browser:

```
Double-click: frontend/index.html
```

Or use VS Code's **Live Server** extension for auto-reload.

---

## CRUD Workflow

### ➕ Create
1. Fill in the form fields (Brand, Model, Year, Price, Fuel Type, Transmission required)
2. Click **ADD CAR**
3. Record is inserted into PostgreSQL
4. Table updates immediately — no page reload

### 📖 Read
- On page load: `GET /api/cars` fetches all records from PostgreSQL
- Dashboard stats are calculated from live data

### ✏️ Edit
1. Click **Edit** on any row
2. Form pre-fills with existing data
3. Modify fields and click **UPDATE CAR**
4. `PUT /api/cars/:id` updates PostgreSQL
5. Table row updates immediately

### 👁️ View
1. Click **View** on any row
2. Modal shows complete car details

### 🗑️ Delete
1. Click **Delete** on any row
2. Confirm in the dialog
3. `DELETE /api/cars/:id` removes from PostgreSQL
4. Row disappears immediately — no page reload

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot connect to backend" | Start `node server.js` in the `backend/` folder |
| "Error connecting to PostgreSQL" | Check `.env` credentials; ensure PostgreSQL is running |
| Blank page / CORS error | Confirm backend is on port 5000; open `index.html` from file system |
| `pg` not found | Run `npm install` inside the `backend/` directory |
| 404 on API routes | Check that you're fetching `http://localhost:5000/api/cars` |
| Table not found | Run `database/schema.sql` against your `car_dealership` database |

---

> **Note:** Sample data in `database/schema.sql` is for testing only.
> The application always reads from live PostgreSQL data.
