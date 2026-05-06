import { loadDb } from "./storage.js";
import { flattenLines, accountLabel } from "./dataModel.js";
import { money, dateFr, emptyState, escapeHtml } from "./ui.js";

export function init() {
  const input = document.getElementById("ledger-search");
  const render = () => renderLedger(input.value || "");
  input.addEventListener("input", render); render();
}

function renderLedger(filter) {
  const target = document.getElementById("ledger-content");
  const lines = flattenLines(loadDb().entries).filter(line => `${line.account} ${line.label} ${line.entryLabel}`.toLowerCase().includes(filter.toLowerCase()));
  if (!lines.length) { target.innerHTML = emptyState("Aucun mouvement ne correspond au filtre."); return; }
  const groups = Map.groupBy ? Map.groupBy(lines, line => line.account) : groupBy(lines);
  target.innerHTML = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([account, accountLines]) => `<h3 class="group-title">${account} — ${escapeHtml(accountLabel(account))}</h3><div class="table-scroll"><table><thead><tr><th>Date</th><th>Réf.</th><th>Libellé</th><th class="money">Débit</th><th class="money">Crédit</th></tr></thead><tbody>${accountLines.map(line => `<tr><td>${dateFr(line.date)}</td><td>${escapeHtml(line.reference || "—")}</td><td>${escapeHtml(line.label || line.entryLabel)}</td><td class="money">${money(line.debit)}</td><td class="money">${money(line.credit)}</td></tr>`).join("")}</tbody></table></div>`).join("");
}

function groupBy(lines) { const map = new Map(); lines.forEach(line => { if (!map.has(line.account)) map.set(line.account, []); map.get(line.account).push(line); }); return map; }
