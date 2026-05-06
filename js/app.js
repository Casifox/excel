import { loadDb, setTheme, restoreRollback, exportSnapshot } from "./storage.js";
import { renderShell, toast, confirmModal, money, emptyState, table, dateFr } from "./ui.js";
import { computeBalance, computeResult, computeBalanceSheet, monthlySeries } from "./dataModel.js";

const page = document.body.dataset.page;
const db = loadDb();
renderShell(page, db.settings.theme);

document.getElementById("theme-toggle")?.addEventListener("click", () => { const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; setTheme(next); location.reload(); });
document.getElementById("rollback-btn")?.addEventListener("click", async () => { if (await confirmModal({ title: "Restaurer le rollback", message: "La base courante sera remplacée par le dernier snapshot de sécurité.", confirmText: "Restaurer", danger: true })) { try { restoreRollback(); toast("Rollback restauré"); location.reload(); } catch (error) { toast(error.message, "error"); } } });
document.getElementById("export-snapshot")?.addEventListener("click", exportSnapshot);

const controllers = {
  dashboard: () => import("./dashboard.js"), journal: () => import("./journal.js"), ledger: () => import("./ledger.js"), balance: () => import("./balance.js"), result: () => import("./resultat.js"), "balance-sheet": () => import("./bilan.js")
};
controllers[page]?.().then(module => module.init?.());

export function renderKpis(target, items) {
  const element = document.getElementById(target);
  if (!element) return;
  element.innerHTML = items.map(item => `<article class="kpi"><small>${item.label}</small><strong class="${item.className || ""}">${item.value}</strong></article>`).join("");
}

export function renderRowsOrEmpty(target, headers, rows, message) {
  const element = document.getElementById(target);
  if (!element) return;
  element.innerHTML = rows.length ? table(headers, rows) : emptyState(message);
}

export function dashboardSummary() {
  const fresh = loadDb();
  const balance = computeBalance(fresh.entries);
  const result = computeResult(fresh.entries);
  const sheet = computeBalanceSheet(fresh.entries);
  return { fresh, balance, result, sheet, series: monthlySeries(fresh.entries), money, dateFr };
}
