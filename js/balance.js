import { loadDb, downloadBlob } from "./storage.js";
import { computeBalance } from "./dataModel.js";
import { money, emptyState, table, escapeHtml } from "./ui.js";

export function init() {
  const rows = computeBalance(loadDb().entries);
  document.getElementById("balance-content").innerHTML = rows.length ? table([
    { label: "Compte" }, { label: "Libellé" }, { label: "Débit", money: true }, { label: "Crédit", money: true }, { label: "Solde débiteur", money: true }, { label: "Solde créditeur", money: true }
  ], rows.map(row => `<tr><td>${row.account}</td><td>${escapeHtml(row.label)}</td><td class="money">${money(row.debit)}</td><td class="money">${money(row.credit)}</td><td class="money">${money(row.debitBalance)}</td><td class="money">${money(row.creditBalance)}</td></tr>`)) : emptyState();
  document.getElementById("export-balance")?.addEventListener("click", () => downloadBlob(new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }), "balance.json"));
}
