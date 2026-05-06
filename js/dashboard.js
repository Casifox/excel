import { dashboardSummary, renderKpis } from "./app.js";
import { money, emptyState, table, dateFr, escapeHtml } from "./ui.js";

export function init() {
  const { fresh, balance, result, sheet, series } = dashboardSummary();
  renderKpis("dashboard-kpis", [
    { label: "Produits", value: money(result.totalProducts), className: "positive" },
    { label: "Charges", value: money(result.totalExpenses), className: "negative" },
    { label: "Résultat", value: money(result.result), className: result.result >= 0 ? "positive" : "negative" },
    { label: "Écritures", value: fresh.entries.length }
  ]);
  renderRecent(fresh.entries);
  renderCharts(series, balance);
}

function renderRecent(entries) {
  const target = document.getElementById("recent-entries");
  if (!entries.length) { target.innerHTML = emptyState(); return; }
  const rows = entries.slice(-5).reverse().map(entry => `<tr><td>${dateFr(entry.date)}</td><td>${escapeHtml(entry.journal)}</td><td>${escapeHtml(entry.label)}</td><td class="money">${money(entry.totals().debit)}</td></tr>`);
  target.innerHTML = table([{ label: "Date" }, { label: "Journal" }, { label: "Libellé" }, { label: "Montant", money: true }], rows);
}

function renderCharts(series, balance) {
  if (!window.Chart) return;
  new Chart(document.getElementById("revenue-expense-chart"), { type: "line", data: { labels: series.map(r => r.month), datasets: [{ label: "CA", data: series.map(r => r.revenue), borderColor: "#2563eb", tension: .35 }, { label: "Charges", data: series.map(r => r.expenses), borderColor: "#dc2626", tension: .35 }] }, options: { responsive: true, maintainAspectRatio: false } });
  const classTotals = [1,2,3,4,5,6,7].map(prefix => balance.filter(r => r.account.startsWith(String(prefix))).reduce((sum, row) => sum + row.debit + row.credit, 0));
  new Chart(document.getElementById("class-chart"), { type: "doughnut", data: { labels: ["1", "2", "3", "4", "5", "6", "7"].map(c => `Classe ${c}`), datasets: [{ data: classTotals, backgroundColor: ["#0f172a", "#2563eb", "#0891b2", "#7c3aed", "#059669", "#dc2626", "#16a34a"] }] }, options: { responsive: true, maintainAspectRatio: false } });
}
