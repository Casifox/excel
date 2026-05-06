import { loadDb } from "./storage.js";
import { computeResult } from "./dataModel.js";
import { renderKpis } from "./app.js";
import { money, emptyState, table, escapeHtml } from "./ui.js";

export function init() {
  const result = computeResult(loadDb().entries);
  renderKpis("result-kpis", [
    { label: "Produits", value: money(result.totalProducts), className: "positive" },
    { label: "Charges", value: money(result.totalExpenses), className: "negative" },
    { label: "Résultat net", value: money(result.result), className: result.result >= 0 ? "positive" : "negative" }
  ]);
  renderList("income-content", result.products, "Aucun produit enregistré.");
  renderList("expense-content", result.expenses, "Aucune charge enregistrée.");
}

function renderList(id, rows, message) {
  document.getElementById(id).innerHTML = rows.length ? table([{ label: "Compte" }, { label: "Libellé" }, { label: "Montant", money: true }], rows.map(row => `<tr><td>${row.account}</td><td>${escapeHtml(row.label)}</td><td class="money">${money(row.amount)}</td></tr>`)) : emptyState(message);
}
