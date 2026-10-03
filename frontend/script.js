/* ════════════════════════════════════════════════════════════
   Car Dealership Management — Frontend Logic
   Connects to Express/PostgreSQL backend at http://localhost:5000
   ════════════════════════════════════════════════════════════ */

const API_BASE = 'http://localhost:5000/api/cars';

// ─── State ────────────────────────────────────────────────────────────────────
let allCars        = [];       // Master list from DB
let editingCarId   = null;     // null = add mode, number = edit mode
let deleteTargetId = null;     // ID pending deletion
let currentViewId  = null;     // ID shown in view modal

// ─── DOM references ───────────────────────────────────────────────────────────
const carForm        = document.getElementById('car-form');
const submitBtn      = document.getElementById('submit-btn');
const submitBtnText  = document.getElementById('submit-btn-text');
const cancelBtn      = document.getElementById('cancel-btn');
const formTitle      = document.getElementById('form-title');
const formModeBadge  = document.getElementById('form-mode-badge');
const editCarId      = document.getElementById('edit-car-id');

const loadingState   = document.getElementById('loading-state');
const errorState     = document.getElementById('error-state');
const emptyState     = document.getElementById('empty-state');
const tableWrapper   = document.getElementById('table-wrapper');
const tableFooter    = document.getElementById('table-footer');
const carsTbody      = document.getElementById('cars-tbody');
const recordCount    = document.getElementById('record-count');

const searchInput    = document.getElementById('search-input');
const filterFuel     = document.getElementById('filter-fuel');
const filterTrans    = document.getElementById('filter-transmission');
const filterAvail    = document.getElementById('filter-availability');

const statusDot      = document.getElementById('status-dot');
const statusText     = document.getElementById('status-text');

const viewModal      = document.getElementById('view-modal');
const deleteModal    = document.getElementById('delete-modal');

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = {
        success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
        error:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
        info:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `${icons[type] || icons.info} <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('removing');
        toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
}

// ─── DB Status ────────────────────────────────────────────────────────────────
function setStatus(state) {
    statusDot.className = 'status-dot';
    if (state === 'connected') {
        statusDot.classList.add('status-dot--connected');
        statusText.textContent = 'Connected';
    } else if (state === 'error') {
        statusDot.classList.add('status-dot--error');
        statusText.textContent = 'Disconnected';
    } else {
        statusText.textContent = 'Connecting...';
    }
}

// ─── Price Formatting ─────────────────────────────────────────────────────────
function formatPrice(price) {
    const p = parseFloat(price);
    if (isNaN(p)) return '—';
    if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
    if (p >= 100000)   return `₹${(p / 100000).toFixed(2)} L`;
    return `₹${p.toLocaleString('en-IN')}`;
}

function formatPriceFull(price) {
    const p = parseFloat(price);
    if (isNaN(p)) return '—';
    return `₹${p.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatInventoryValue(total) {
    if (isNaN(total) || total === 0) return '₹0';
    if (total >= 10000000) return `₹${(total / 10000000).toFixed(2)} Cr`;
    if (total >= 100000)   return `₹${(total / 100000).toFixed(2)} L`;
    return `₹${total.toLocaleString('en-IN')}`;
}

function formatMileage(m) {
    if (m === null || m === undefined || m === '') return '—';
    return `${parseInt(m).toLocaleString('en-IN')} km`;
}

// ─── Statistics ───────────────────────────────────────────────────────────────
function updateStats(cars) {
    const total     = cars.length;
    const available = cars.filter(c => c.availability === true).length;
    const sold      = total - available;
    const value     = cars.reduce((acc, c) => acc + parseFloat(c.price || 0), 0);

    animateNumber('stat-total-val',     total);
    animateNumber('stat-available-val', available);
    animateNumber('stat-sold-val',      sold);
    document.getElementById('stat-value-val').textContent = formatInventoryValue(value);
}

function animateNumber(id, target) {
    const el = document.getElementById(id);
    const current = parseInt(el.textContent) || 0;
    if (current === target) { el.textContent = target; return; }
    const duration = 400;
    const start = performance.now();
    requestAnimationFrame(function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(current + (target - current) * eased);
        if (progress < 1) requestAnimationFrame(step);
    });
}

// ─── CRUD: Fetch All Cars ─────────────────────────────────────────────────────
async function fetchCars() {
    showTableState('loading');
    try {
        const res  = await fetch(API_BASE);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load cars.');
        allCars = json.data;
        setStatus('connected');
        renderTable();
        updateStats(allCars);
    } catch (err) {
        setStatus('error');
        showTableState('error');
        document.getElementById('error-message').textContent =
            err.message.includes('Failed to fetch')
                ? 'Cannot connect to the backend server. Make sure Node.js is running on port 5000.'
                : err.message;
    }
}

// ─── CRUD: Create Car ─────────────────────────────────────────────────────────
async function createCar(data) {
    const res  = await fetch(API_BASE, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to add car.');
    return json.data;
}

// ─── CRUD: Update Car ─────────────────────────────────────────────────────────
async function updateCar(id, data) {
    const res  = await fetch(`${API_BASE}/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update car.');
    return json.data;
}

// ─── CRUD: Delete Car ─────────────────────────────────────────────────────────
async function deleteCar(id) {
    const res  = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to delete car.');
    return json.data;
}

// ─── Table Rendering ──────────────────────────────────────────────────────────
function renderTable() {
    const q    = searchInput.value.toLowerCase().trim();
    const fuel = filterFuel.value;
    const tran = filterTrans.value;
    const avail = filterAvail.value;

    let filtered = allCars.filter(car => {
        const matchSearch =
            !q ||
            car.brand.toLowerCase().includes(q) ||
            car.model.toLowerCase().includes(q) ||
            (car.fuel_type || '').toLowerCase().includes(q) ||
            (car.transmission || '').toLowerCase().includes(q);

        const matchFuel  = !fuel  || car.fuel_type === fuel;
        const matchTrans = !tran  || car.transmission === tran;
        const matchAvail = avail === '' || String(car.availability) === avail;

        return matchSearch && matchFuel && matchTrans && matchAvail;
    });

    if (filtered.length === 0 && allCars.length === 0) {
        showTableState('empty');
    } else if (filtered.length === 0) {
        showTableState('empty');
        emptyState.querySelector('h3').textContent = 'No matching cars found';
        emptyState.querySelector('p').textContent = 'Try adjusting your search or filter criteria.';
    } else {
        showTableState('table');
        carsTbody.innerHTML = filtered.map(car => buildRow(car)).join('');
        recordCount.textContent = `Showing ${filtered.length} of ${allCars.length} record${allCars.length !== 1 ? 's' : ''}`;
    }
}

function buildRow(car) {
    const availBadge = car.availability
        ? `<span class="badge badge--available">● Available</span>`
        : `<span class="badge badge--sold">✕ Sold</span>`;

    return `
    <tr data-car-id="${car.id}">
        <td class="cell-id">#${car.id}</td>
        <td class="cell-brand">${escHtml(car.brand)}</td>
        <td class="cell-model">${escHtml(car.model)}</td>
        <td class="cell-year">${car.year}</td>
        <td class="cell-price">${formatPrice(car.price)}</td>
        <td><span class="badge badge--fuel">${escHtml(car.fuel_type)}</span></td>
        <td><span class="badge badge--trans">${escHtml(car.transmission)}</span></td>
        <td>${car.color ? escHtml(car.color) : '<span style="color:var(--text-muted)">—</span>'}</td>
        <td class="cell-mileage">${formatMileage(car.mileage)}</td>
        <td>${availBadge}</td>
        <td>
            <div class="action-cell">
                <button class="btn btn--ghost btn--sm" onclick="openViewModal(${car.id})" title="View details" id="view-btn-${car.id}">View</button>
                <button class="btn btn--primary btn--sm" onclick="startEdit(${car.id})" title="Edit car" id="edit-btn-${car.id}">Edit</button>
                <button class="btn btn--danger btn--sm"  onclick="openDeleteModal(${car.id})" title="Delete car" id="delete-btn-${car.id}">Delete</button>
            </div>
        </td>
    </tr>`;
}

function escHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str || ''));
    return d.innerHTML;
}

function showTableState(state) {
    loadingState.style.display  = state === 'loading' ? 'flex' : 'none';
    errorState.style.display    = state === 'error'   ? 'flex' : 'none';
    emptyState.style.display    = state === 'empty'   ? 'flex' : 'none';
    tableWrapper.style.display  = state === 'table'   ? 'block' : 'none';
    tableFooter.style.display   = state === 'table'   ? 'block' : 'none';
    if (state !== 'empty') {
        emptyState.querySelector('h3').textContent = 'No cars in inventory';
        emptyState.querySelector('p').textContent  = 'Add your first car using the form above.';
    }
}

// ─── Form: Validation ─────────────────────────────────────────────────────────
function clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('invalid'));
}

function setError(fieldId, errId, message) {
    const field = document.getElementById(fieldId);
    const err   = document.getElementById(errId);
    if (field) field.classList.add('invalid');
    if (err)   err.textContent = message;
}

function validateForm() {
    clearErrors();
    let valid = true;
    const cur = new Date().getFullYear();

    const brand = document.getElementById('brand').value.trim();
    const model = document.getElementById('model').value.trim();
    const year  = document.getElementById('year').value.trim();
    const price = document.getElementById('price').value.trim();
    const fuel  = document.getElementById('fuel_type').value;
    const trans = document.getElementById('transmission').value;
    const mil   = document.getElementById('mileage').value.trim();

    if (!brand) { setError('brand', 'err-brand', 'Brand is required.'); valid = false; }
    if (!model) { setError('model', 'err-model', 'Model is required.'); valid = false; }

    const y = parseInt(year);
    if (!year || isNaN(y) || y < 1886 || y > cur + 2) {
        setError('year', 'err-year', `Year must be between 1886 and ${cur + 2}.`); valid = false;
    }
    const p = parseFloat(price);
    if (!price || isNaN(p) || p <= 0) {
        setError('price', 'err-price', 'Price must be a positive number.'); valid = false;
    }
    if (!fuel)  { setError('fuel_type',    'err-fuel_type',    'Fuel type is required.'); valid = false; }
    if (!trans) { setError('transmission', 'err-transmission', 'Transmission is required.'); valid = false; }
    if (mil !== '') {
        const m = parseInt(mil);
        if (isNaN(m) || m < 0) { setError('mileage', 'err-mileage', 'Mileage cannot be negative.'); valid = false; }
    }
    return valid;
}

function getFormData() {
    const mil   = document.getElementById('mileage').value.trim();
    const color = document.getElementById('color').value.trim();
    return {
        brand:        document.getElementById('brand').value.trim(),
        model:        document.getElementById('model').value.trim(),
        year:         parseInt(document.getElementById('year').value),
        price:        parseFloat(document.getElementById('price').value),
        fuel_type:    document.getElementById('fuel_type').value,
        transmission: document.getElementById('transmission').value,
        color:        color || null,
        mileage:      mil !== '' ? parseInt(mil) : null,
        availability: document.getElementById('availability').value === 'true',
    };
}

function resetForm() {
    carForm.reset();
    clearErrors();
    editingCarId = null;
    editCarId.value = '';
    formTitle.textContent = 'ADD NEW CAR';
    submitBtnText.textContent = 'ADD CAR';
    submitBtn.querySelector('svg').style.display = '';
    formModeBadge.textContent = 'NEW';
    formModeBadge.classList.remove('form-mode-badge--edit');
    cancelBtn.style.display = 'none';
}

// ─── Form: Submit ─────────────────────────────────────────────────────────────
carForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = getFormData();
    submitBtn.disabled = true;
    submitBtnText.textContent = editingCarId ? 'UPDATING...' : 'ADDING...';

    try {
        if (editingCarId) {
            const updated = await updateCar(editingCarId, data);
            // Update in local array
            const idx = allCars.findIndex(c => c.id === editingCarId);
            if (idx !== -1) allCars[idx] = updated;
            showToast(`${updated.brand} ${updated.model} updated successfully.`, 'success');
        } else {
            const created = await createCar(data);
            allCars.unshift(created);
            showToast(`${created.brand} ${created.model} added to inventory.`, 'success');
        }
        resetForm();
        renderTable();
        updateStats(allCars);
        // Scroll to table
        document.querySelector('.table-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtnText.textContent = editingCarId ? 'UPDATE CAR' : 'ADD CAR';
    }
});

// ─── Edit Mode ────────────────────────────────────────────────────────────────
function startEdit(id) {
    const car = allCars.find(c => c.id === id);
    if (!car) return;

    editingCarId = id;
    editCarId.value = id;

    // Populate form
    document.getElementById('brand').value        = car.brand || '';
    document.getElementById('model').value        = car.model || '';
    document.getElementById('year').value         = car.year  || '';
    document.getElementById('price').value        = car.price || '';
    document.getElementById('fuel_type').value    = car.fuel_type || '';
    document.getElementById('transmission').value = car.transmission || '';
    document.getElementById('color').value        = car.color || '';
    document.getElementById('mileage').value      = car.mileage !== null && car.mileage !== undefined ? car.mileage : '';
    document.getElementById('availability').value = String(car.availability);

    clearErrors();

    // Update UI to edit mode
    formTitle.textContent = 'UPDATE CAR';
    submitBtnText.textContent = 'UPDATE CAR';
    submitBtn.querySelector('svg').style.display = 'none';
    formModeBadge.textContent = 'EDIT';
    formModeBadge.classList.add('form-mode-badge--edit');
    cancelBtn.style.display = 'inline-flex';

    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelEdit() { resetForm(); }

// ─── View Modal ───────────────────────────────────────────────────────────────
function openViewModal(id) {
    const car = allCars.find(c => c.id === id);
    if (!car) return;
    currentViewId = id;

    document.getElementById('view-modal-title').textContent = `${car.brand} ${car.model}`;
    const grid = document.getElementById('view-detail-grid');

    const details = [
        { key: 'ID',           val: `#${car.id}` },
        { key: 'Year',         val: car.year },
        { key: 'Price',        val: formatPriceFull(car.price), full: false },
        { key: 'Fuel Type',    val: car.fuel_type },
        { key: 'Transmission', val: car.transmission },
        { key: 'Color',        val: car.color || '—' },
        { key: 'Mileage',      val: formatMileage(car.mileage) },
        { key: 'Availability', val: car.availability ? '✓ Available' : '✕ Sold / Unavailable' },
        { key: 'Added On',     val: new Date(car.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), full: true },
    ];

    grid.innerHTML = details.map(d =>
        `<div class="detail-item${d.full ? ' detail-item--full' : ''}">
            <div class="detail-key">${d.key}</div>
            <div class="detail-val">${d.val}</div>
        </div>`
    ).join('');

    viewModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeViewModal() {
    viewModal.style.display = 'none';
    document.body.style.overflow = '';
    currentViewId = null;
}

function editFromView() {
    if (currentViewId !== null) {
        closeViewModal();
        startEdit(currentViewId);
    }
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function openDeleteModal(id) {
    const car = allCars.find(c => c.id === id);
    if (!car) return;
    deleteTargetId = id;
    document.getElementById('delete-modal-message').textContent =
        `Are you sure you want to delete ${car.brand} ${car.model} (${car.year})? This action cannot be undone.`;
    deleteModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    deleteModal.style.display = 'none';
    document.body.style.overflow = '';
    deleteTargetId = null;
}

async function confirmDelete() {
    if (deleteTargetId === null) return;
    const id  = deleteTargetId;
    const car = allCars.find(c => c.id === id);
    const confirmBtn = document.getElementById('confirm-delete-btn');

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'DELETING...';

    try {
        await deleteCar(id);
        allCars = allCars.filter(c => c.id !== id);
        closeDeleteModal();
        renderTable();
        updateStats(allCars);
        showToast(`${car ? car.brand + ' ' + car.model : 'Car'} deleted from inventory.`, 'success');
    } catch (err) {
        closeDeleteModal();
        showToast(err.message, 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'DELETE';
    }
}

// ─── Close Modals on Overlay Click ────────────────────────────────────────────
viewModal.addEventListener('click', e => { if (e.target === viewModal) closeViewModal(); });
deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });

// ─── Keyboard: Escape closes modals ───────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (viewModal.style.display   !== 'none') closeViewModal();
        if (deleteModal.style.display !== 'none') closeDeleteModal();
    }
});

// ─── Search & Filter (real-time) ──────────────────────────────────────────────
searchInput.addEventListener('input',  renderTable);
filterFuel.addEventListener('change',  renderTable);
filterTrans.addEventListener('change', renderTable);
filterAvail.addEventListener('change', renderTable);

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', fetchCars);
