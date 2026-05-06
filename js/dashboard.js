import { aggregateBalance, computeBalanceSheet, computeIncomeStatement, roundMoney } from './dataModel.js';
import { listEntries } from './storage.js';
import { emptyState, formatMoney, qs, renderMiniBars } from './ui.js';

function initDashboard() {
  const entries = listEntries();
  if (!entries.length) {
    qs('#dashboardContent').innerHTML = '';
    qs('#dashboardContent').append(emptyState({ title: 'Comptabilité vierge', text: 'Votre espace est prêt, sans données de démonstration.', onAction: () => location.href = 'journal.html#new' }));
    return;
  }
  const income = computeIncomeStatement(entries);
  const sheet = computeBalanceSheet(entries);
  const balance = aggregateBalance(entries);
  qs('#kpiRevenue').textContent = formatMoney(income.products);
  qs('#kpiExpenses').textContent = formatMoney(income.charges);
  qs('#kpiResult').textContent = formatMoney(income.result);
  qs('#kpiCash').textContent = formatMoney(balance.filter((r) => r.account.startsWith('5')).reduce((s, r) => roundMoney(s + r.debit - r.credit), 0));
  qs('#sheetGap').textContent = formatMoney(sheet.gap);
  const monthly = buildMonthly(entries);
  renderMiniBars(qs('#chartCanvas'), monthly.labels, monthly.revenues, monthly.expenses);
}

function buildMonthly(entries) {
  const map = new Map();
  entries.forEach((entry) => {
    const key = entry.date.slice(0, 7);
    const row = map.get(key) || { revenue: 0, expense: 0 };
    entry.lines.forEach((line) => {
      if (line.account.startsWith('7')) row.revenue = roundMoney(row.revenue + line.credit - line.debit);
      if (line.account.startsWith('6')) row.expense = roundMoney(row.expense + line.debit - line.credit);
    });
    map.set(key, row);
  });
  const rows = [...map.entries()].sort().slice(-12);
  return { labels: rows.map(([k]) => k.slice(5)), revenues: rows.map(([, v]) => v.revenue), expenses: rows.map(([, v]) => v.expense) };
}

initDashboard();
