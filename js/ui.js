import { accountOptions, parseAmount, roundMoney } from './dataModel.js';

export const moneyFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
export const dateFormatter = new Intl.DateTimeFormat('fr-FR');

export function formatMoney(value) {
  return moneyFormatter.format(roundMoney(value));
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function toast(message, type = 'success') {
  let host = qs('#toastHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toastHost';
    host.className = 'toast-host';
    document.body.appendChild(host);
  }
  const item = document.createElement('div');
  item.className = `toast ${type}`;
  item.textContent = message;
  host.appendChild(item);
  setTimeout(() => item.classList.add('show'), 30);
  setTimeout(() => {
    item.classList.remove('show');
    setTimeout(() => item.remove(), 250);
  }, 3500);
}

export function modal({ title, body, actions = [] }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal"><div class="modal-header"><h2>${title}</h2><button class="icon-btn" data-close>×</button></div><div class="modal-body"></div><div class="modal-actions"></div></div>`;
  qs('.modal-body', overlay).append(body instanceof Node ? body : document.createRange().createContextualFragment(String(body)));
  const actionHost = qs('.modal-actions', overlay);
  actions.forEach((action) => {
    const btn = document.createElement('button');
    btn.className = action.className || 'btn';
    btn.textContent = action.label;
    btn.addEventListener('click', () => action.onClick?.(overlay));
    actionHost.append(btn);
  });
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target.matches('[data-close]')) overlay.remove();
  });
  document.body.append(overlay);
  return overlay;
}

export function emptyState({ title, text, actionLabel = 'Nouvelle écriture', onAction }) {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.innerHTML = `<div class="empty-icon">∅</div><h2>${title}</h2><p>${text}</p><button class="btn primary">${actionLabel}</button>`;
  qs('button', div).addEventListener('click', onAction);
  return div;
}

export function attachAmountEvaluator(input) {
  input.addEventListener('blur', () => {
    const amount = parseAmount(input.value);
    if (Number.isFinite(amount)) input.value = amount || '';
  });
}

export function attachAccountAutocomplete(input) {
  const list = document.createElement('div');
  list.className = 'autocomplete hidden';
  input.parentElement.append(list);
  const render = () => {
    const options = accountOptions(input.value);
    list.innerHTML = options.map((o) => `<button type="button" data-account="${o.number}"><strong>${o.number}</strong><span>${o.label}</span></button>`).join('');
    list.classList.toggle('hidden', options.length === 0 || !document.activeElement.isSameNode(input));
  };
  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  input.addEventListener('blur', () => setTimeout(() => list.classList.add('hidden'), 120));
  list.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn) return;
    input.value = btn.dataset.account;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    list.classList.add('hidden');
  });
}

export function renderTable(container, columns, rows, emptyText = 'Aucune donnée') {
  if (!rows.length) {
    container.innerHTML = `<div class="table-empty">${emptyText}</div>`;
    return;
  }
  container.innerHTML = `<div class="table-wrap"><table><thead><tr>${columns.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead><tbody></tbody></table></div>`;
  const tbody = qs('tbody', container);
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = columns.map((c) => `<td>${c.render ? c.render(row) : row[c.key] ?? ''}</td>`).join('');
    tbody.append(tr);
  });
}

export function renderMiniBars(canvas, labels, revenues, expenses) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth * devicePixelRatio;
  const height = canvas.height = 260 * devicePixelRatio;
  ctx.clearRect(0, 0, width, height);
  const max = Math.max(...revenues, ...expenses, 1);
  const padding = 34 * devicePixelRatio;
  const gap = 12 * devicePixelRatio;
  const groupWidth = (width - padding * 2) / Math.max(labels.length, 1);
  ctx.font = `${12 * devicePixelRatio}px Inter, sans-serif`;
  labels.forEach((label, i) => {
    const x = padding + i * groupWidth + gap;
    const revH = (height - padding * 2) * (revenues[i] / max);
    const expH = (height - padding * 2) * (expenses[i] / max);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(x, height - padding - revH, groupWidth / 3, revH);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + groupWidth / 3 + 3 * devicePixelRatio, height - padding - expH, groupWidth / 3, expH);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted');
    ctx.fillText(label, x, height - 10 * devicePixelRatio);
  });
}
