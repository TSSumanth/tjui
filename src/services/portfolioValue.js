import { API_URLS } from '../config/api';

const API_BASE = API_URLS.PORTFOLIO_VALUE;

// Create a new portfolio value record
export async function createPortfolioValue(data) {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}

// Get a portfolio value record by id and account_id (or just account_id)
export async function getPortfolioValue({ id, account_id }) {
    const params = new URLSearchParams();
    if (id !== undefined && id !== null) params.append('id', id);
    if (account_id) params.append('account_id', account_id);
    const res = await fetch(`${API_BASE}?${params.toString()}`);
    return res.json();
}

// Update a portfolio value record by id and account_id
export async function updatePortfolioValue(data) {
    const res = await fetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}

// Delete a portfolio value record by id and account_id
export async function deletePortfolioValue({ id, account_id }) {
    const res = await fetch(API_BASE, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, account_id })
    });
    return res.json();
}

// Get all portfolio value records
export async function getAllPortfolioValues() {
    const res = await fetch(`${API_BASE}/all`);
    return res.json();
} 