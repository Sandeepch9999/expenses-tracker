const API_BASE = 'http://localhost:8081/expenses';

const CATEGORY_META = {
  Food:          { emoji: '🍔', colorClass: 'cat-food',          chartColor: '#f59e0b', bgClass: 'card-orange' },
  Housing:       { emoji: '🏠', colorClass: 'cat-housing',       chartColor: '#3b82f6', bgClass: 'card-blue' },
  Transport:     { emoji: '🚌', colorClass: 'cat-transport',     chartColor: '#6366f1', bgClass: 'card-blue' },
  Education:     { emoji: '📚', colorClass: 'cat-education',     chartColor: '#10b981', bgClass: 'card-green' },
  Healthcare:    { emoji: '💊', colorClass: 'cat-healthcare',    chartColor: '#ef4444', bgClass: 'card-pink' },
  Entertainment: { emoji: '🎮', colorClass: 'cat-entertainment', chartColor: '#ec4899', bgClass: 'card-pink' },
  Shopping:      { emoji: '🛍️', colorClass: 'cat-shopping',      chartColor: '#06b6d4', bgClass: 'card-blue' },
  Utilities:     { emoji: '⚡', colorClass: 'cat-utilities',     chartColor: '#eab308', bgClass: 'card-orange' },
  Other:         { emoji: '📌', colorClass: 'cat-other',         chartColor: '#9ca3af', bgClass: 'card-blue' },
};

let allExpenses = [];
let pieChart = null;

// ─── NAVIGATION ───────────────────────────────────────────────
function navigateTo(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const target = document.getElementById(`view-${view}`);
  if (target) target.classList.add('active');
  document.querySelectorAll(`[data-view="${view}"]`).forEach(b => b.classList.add('active'));
  if (view === 'history') renderHistory();
}

document.querySelectorAll('[data-view]').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.view));
});

// ─── API CALLS ────────────────────────────────────────────────
async function fetchExpenses() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Server error');
    allExpenses = await res.json();
    renderAll();
  } catch (err) {
    showToast('Cannot connect to server. Make sure Spring Boot is running on port 8081.', 'error');
    console.error('Fetch error:', err);
  }
}

async function addExpense(data) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to add expense');
  }
  return res.json();
}

async function deleteExpense(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete expense');
}

// ─── RENDER ALL ───────────────────────────────────────────────
function renderAll() {
  updateHeroCard();
  updateCategoryCards();
  renderPieChart();
  renderInsights();
  renderRecentList();
  if (document.getElementById('view-history').classList.contains('active')) {
    renderHistory();
  }
}

// ─── HERO CARD ────────────────────────────────────────────────
function updateHeroCard() {
  const total = allExpenses.reduce((s, e) => s + e.amount, 0);
  document.getElementById('totalAmount').textContent = fmt(total);
  document.getElementById('expenseCount').textContent =
    `${allExpenses.length} transaction${allExpenses.length !== 1 ? 's' : ''}`;

  const now = new Date();
  const monthly = allExpenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + e.amount, 0);
  document.getElementById('monthlyAmount').textContent = fmt(monthly);
  document.getElementById('chartCenterValue').textContent = fmtShort(total);

  const catTotals = getCategoryTotals();
  const top = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('topCategory').textContent = top ? top[0] : '—';
}

// ─── CATEGORY SUMMARY CARDS ───────────────────────────────────
function updateCategoryCards() {
  const totals = getCategoryTotals();
  ['Housing', 'Food', 'Education', 'Entertainment'].forEach(cat => {
    const el = document.getElementById(`cat-${cat}`);
    if (el) el.textContent = fmt(totals[cat] || 0);
  });
}

// ─── PIE CHART ────────────────────────────────────────────────
function renderPieChart() {
  const catTotals = getCategoryTotals();
  const labels = Object.keys(catTotals);
  const data = Object.values(catTotals);
  const colors = labels.map(l => (CATEGORY_META[l] || CATEGORY_META.Other).chartColor);

  const ctx = document.getElementById('pieChart').getContext('2d');

  if (pieChart) {
    pieChart.data.labels = labels;
    pieChart.data.datasets[0].data = data;
    pieChart.data.datasets[0].backgroundColor = colors;
    pieChart.update('active');
    return;
  }

  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: 'transparent',
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,20,40,0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#f0f4ff',
          bodyColor: '#94a3b8',
          padding: 12,
          callbacks: {
            label: ctx => ` ${ctx.label}: ${fmt(ctx.parsed)}`,
          },
        },
      },
      animation: { animateRotate: true, duration: 600 },
    },
  });
}

// ─── INSIGHTS ─────────────────────────────────────────────────
function renderInsights() {
  const container = document.getElementById('insightsList');
  const total = allExpenses.reduce((s, e) => s + e.amount, 0);
  const catTotals = getCategoryTotals();

  if (total === 0) {
    container.innerHTML = `
      <div class="insight-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
        </svg>
        <p>Add expenses to see insights</p>
      </div>`;
    return;
  }

  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const topCat = sorted[0];
  const pct = (topCat[1] / total * 100).toFixed(0);
  const meta = CATEGORY_META[topCat[0]] || CATEGORY_META.Other;

  let html = sorted.slice(0, 4).map(([cat, amt]) => {
    const p = (amt / total * 100).toFixed(0);
    const m = CATEGORY_META[cat] || CATEGORY_META.Other;
    return `
      <div class="insight-item">
        <div class="insight-icon" style="background:${m.chartColor}22;font-size:18px">${m.emoji}</div>
        <div class="insight-body">
          <div class="insight-label">${cat}</div>
          <div class="insight-detail">${fmt(amt)} of ${fmt(total)}</div>
        </div>
        <span class="insight-pct" style="color:${m.chartColor}">${p}%</span>
      </div>`;
  }).join('');

  const topMsg = `You spent ${pct}% on ${topCat[0]} — your biggest category.`;
  html += `<div class="insight-item" style="margin-top:4px;background:rgba(59,130,246,0.07);border-color:rgba(59,130,246,0.15)">
    <div class="insight-icon" style="background:rgba(59,130,246,0.15);color:#60a5fa">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
      </svg>
    </div>
    <div class="insight-body"><div class="insight-label" style="font-size:13px;color:#93c5fd">${topMsg}</div></div>
  </div>`;

  container.innerHTML = html;
}

// ─── RECENT LIST ──────────────────────────────────────────────
function renderRecentList() {
  const container = document.getElementById('recentList');
  const recent = [...allExpenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.25">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
        </svg>
        <p>No expenses yet.<br/>Start by adding your first expense.</p>
        <button class="glass-btn primary-btn" style="max-width:180px;margin-top:8px" data-view="add">Add Expense</button>
      </div>`;
    container.querySelectorAll('[data-view]').forEach(b =>
      b.addEventListener('click', () => navigateTo(b.dataset.view)));
    return;
  }

  container.innerHTML = recent.map(e => txRow(e)).join('');
  attachDeleteListeners(container);
}

// ─── HISTORY ──────────────────────────────────────────────────
function renderHistory() {
  const filterCat = document.getElementById('filterCategory').value;
  const filtered = filterCat
    ? allExpenses.filter(e => e.category === filterCat)
    : allExpenses;

  document.getElementById('historyCount').textContent =
    `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`;

  const container = document.getElementById('fullList');
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.25">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>No expenses found.</p>
      </div>`;
    return;
  }

  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
  container.innerHTML = sorted.map(e => txRow(e)).join('');
  attachDeleteListeners(container);
}

// ─── TRANSACTION ROW ──────────────────────────────────────────
function txRow(e) {
  const meta = CATEGORY_META[e.category] || CATEGORY_META.Other;
  const dateStr = new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  return `
    <div class="transaction-item" data-id="${e.id}">
      <div class="tx-icon" style="background:${meta.chartColor}18;font-size:22px">${meta.emoji}</div>
      <div class="tx-body">
        <div class="tx-desc">${escHtml(e.description || e.category)}</div>
        <div class="tx-meta">
          <span class="tx-cat ${meta.colorClass}">${e.category}</span>
          &nbsp;·&nbsp; ${dateStr}
        </div>
      </div>
      <span class="tx-amount">-${fmt(e.amount)}</span>
      <button class="tx-delete" data-id="${e.id}" title="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
        </svg>
      </button>
    </div>`;
}

function attachDeleteListeners(container) {
  container.querySelectorAll('.tx-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      const row = btn.closest('.transaction-item');
      row.style.opacity = '0.5';
      try {
        await deleteExpense(id);
        allExpenses = allExpenses.filter(ex => ex.id !== id);
        showToast('Expense deleted', 'success');
        renderAll();
        if (document.getElementById('view-history').classList.contains('active')) {
          renderHistory();
        }
      } catch {
        row.style.opacity = '1';
        showToast('Failed to delete expense', 'error');
      }
    });
  });
}

// ─── FORM ─────────────────────────────────────────────────────
const form = document.getElementById('expenseForm');
const submitBtn = document.getElementById('submitBtn');

document.getElementById('date').valueAsDate = new Date();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const data = {
    amount: parseFloat(form.amount.value),
    category: form.category.value,
    description: form.description.value.trim(),
    date: form.date.value,
  };

  setLoading(true);
  try {
    const saved = await addExpense(data);
    allExpenses.unshift(saved);
    renderAll();
    form.reset();
    document.getElementById('date').valueAsDate = new Date();
    showSuccessBanner();
    showToast('Expense added!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setLoading(false);
  }
});

function validateForm() {
  let valid = true;
  clearErrors();

  if (!form.amount.value || parseFloat(form.amount.value) <= 0) {
    document.getElementById('amountError').textContent = 'Please enter a valid amount';
    valid = false;
  }
  if (!form.category.value) {
    document.getElementById('categoryError').textContent = 'Please select a category';
    valid = false;
  }
  if (!form.date.value) {
    document.getElementById('dateError').textContent = 'Please select a date';
    valid = false;
  }
  return valid;
}

function clearErrors() {
  ['amountError', 'categoryError', 'dateError'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
}

function setLoading(loading) {
  const text = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.btn-spinner');
  submitBtn.disabled = loading;
  text.classList.toggle('hidden', loading);
  spinner.classList.toggle('hidden', !loading);
}

function showSuccessBanner() {
  const banner = document.getElementById('successBanner');
  banner.classList.remove('hidden');
  setTimeout(() => banner.classList.add('hidden'), 3000);
}

document.getElementById('cancelBtn').addEventListener('click', () => {
  form.reset();
  document.getElementById('date').valueAsDate = new Date();
  clearErrors();
  document.getElementById('successBanner').classList.add('hidden');
  navigateTo('dashboard');
});

// ─── FILTER ───────────────────────────────────────────────────
document.getElementById('filterCategory').addEventListener('change', renderHistory);

// ─── REFRESH ──────────────────────────────────────────────────
document.getElementById('refreshBtn').addEventListener('click', () => {
  const btn = document.getElementById('refreshBtn');
  btn.style.animation = 'spinAnim 0.6s linear';
  fetchExpenses().then(() => {
    setTimeout(() => btn.style.animation = '', 600);
    showToast('Data refreshed', 'success');
  });
});

// ─── UTILS ────────────────────────────────────────────────────
function getCategoryTotals() {
  const totals = {};
  allExpenses.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });
  return totals;
}

function fmt(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function fmtShort(amount) {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`;
  return `$${amount.toFixed(0)}`;
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

let toastTimer;
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── INIT ─────────────────────────────────────────────────────
fetchExpenses();
