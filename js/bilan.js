import { loadDb } from "./storage.js";
import { computeBalanceSheet } from "./dataModel.js";
import { renderKpis } from "./app.js";
import { money, emptyState, table, escapeHtml } from "./ui.js";

export function init() {
  const sheet = computeBalanceSheet(loadDb().entries);
  const gap = sheet.totalAssets - sheet.totalLiabilities;
  renderKpis("bilan-kpis", [
    { label: "Total actif", value: money(sheet.totalAssets), className: "positive" },
    { label: "Total passif", value: money(sheet.totalLiabilities) },
    { label: "Écart", value: money(gap), className: Math.abs(gap) < .01 ? "positive" : "negative" }
  ]);
  renderList("assets-content", sheet.assets, "Aucun actif calculé.");
  renderList("liabilities-content", sheet.liabilities, "Aucun passif calculé.");
}

function renderList(id, rows, message) {
  document.getElementById(id).innerHTML = rows.length ? table([{ label: "Compte" }, { label: "Libellé" }, { label: "Montant", money: true }], rows.map(row => `<tr><td>${row.account}</td><td>${escapeHtml(row.label)}</td><td class="money">${money(row.amount)}</td></tr>`)) : emptyState(message);
}
