import { ACCOUNT_PLAN, accountLabel, roundMoney } from "./dataModel.js";

export const money = value => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(roundMoney(value || 0));
export const dateFr = value => value ? new Intl.DateTimeFormat("fr-FR").format(new Date(`${value}T00:00:00`)) : "—";
export const escapeHtml = value => String(value ?? "").replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));

export function toast(message, type = "success") {
  const root = document.getElementById("toast-root") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "toast-root" }));
  const item = document.createElement("div");
  item.className = `toast ${type}`; item.textContent = message; root.appendChild(item);
  setTimeout(() => item.remove(), 3800);
}

export function confirmModal({ title, message, confirmText = "Confirmer", danger = false }) {
  return new Promise(resolve => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `<div class="modal"><h2>${escapeHtml(title)}</h2><p class="muted">${escapeHtml(message)}</p><div class="modal-actions"><button class="btn btn-secondary" data-cancel>Annuler</button><button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-confirm>${escapeHtml(confirmText)}</button></div></div>`;
    document.body.appendChild(backdrop);
    backdrop.querySelector("[data-cancel]").addEventListener("click", () => { backdrop.remove(); resolve(false); });
    backdrop.querySelector("[data-confirm]").addEventListener("click", () => { backdrop.remove(); resolve(true); });
  });
}

export function renderShell(activePage, theme = "light") {
  document.documentElement.dataset.theme = theme;
  const pages = [["dashboard", "index.html", "Dashboard"], ["journal", "journal.html", "Journal"], ["ledger", "grand-livre.html", "Grand livre"], ["balance", "balance.html", "Balance"], ["result", "resultat.html", "Résultat"], ["balance-sheet", "bilan.html", "Bilan"]];
  document.getElementById("app-shell").innerHTML = `<div class="mobile-topbar"><strong>Compta SaaS</strong><button class="btn btn-secondary" id="menu-toggle">Menu</button></div><aside class="sidebar"><div class="brand"><span class="brand-mark">€</span><span>Compta SaaS</span></div><nav class="nav">${pages.map(([key, href, label]) => `<a class="${key === activePage ? "active" : ""}" href="${href}">${label}<span>›</span></a>`).join("")}</nav><div class="sidebar-footer"><button class="btn btn-secondary" id="theme-toggle">Mode ${theme === "dark" ? "clair" : "sombre"}</button><button class="btn btn-ghost" id="rollback-btn">Rollback</button></div></aside>`;
  document.getElementById("menu-toggle")?.addEventListener("click", () => document.body.classList.toggle("sidebar-open"));
}

export function emptyState(message = "Aucune écriture pour le moment.") {
  return `<div class="empty-state"><h3>Base vierge</h3><p class="muted">${escapeHtml(message)}</p><a class="btn btn-primary" href="journal.html">Nouvelle écriture</a></div>`;
}

export function table(headers, rows) {
  return `<div class="table-scroll"><table><thead><tr>${headers.map(h => `<th class="${h.money ? "money" : ""}">${h.label}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
}

export function accountOptions() {
  return Object.entries(ACCOUNT_PLAN).map(([code, label]) => `<option value="${code}">${code} — ${escapeHtml(label)}</option>`).join("");
}

export function accountHint(account) { return `${account} — ${accountLabel(account)}`; }
