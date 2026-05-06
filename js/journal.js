import { addEntry, deleteEntry, exportJournalCsv, lockPeriod, exportSnapshot, loadDb } from "./storage.js";
import { JournalEntry, evaluateAmount, buildVatLines, accountLabel } from "./dataModel.js";
import { toast, confirmModal, money, dateFr, emptyState, table, escapeHtml, accountOptions } from "./ui.js";

export function init() {
  document.getElementById("entry-date").valueAsDate = new Date();
  document.getElementById("entry-label-preset").addEventListener("change", syncEntryLabel);
  document.getElementById("entry-label-custom").addEventListener("input", syncEntryLabel);
  document.getElementById("vat-mode").addEventListener("change", syncVatCustomRate);
  syncEntryLabel();
  syncVatCustomRate();
  document.getElementById("new-entry").addEventListener("click", resetForm);
  document.getElementById("add-line").addEventListener("click", () => addLine());
  document.getElementById("apply-vat").addEventListener("click", applyVat);
  document.getElementById("export-csv").addEventListener("click", exportJournalCsv);
  document.getElementById("entry-form").addEventListener("submit", saveEntry);
  document.getElementById("clear-period").addEventListener("click", closePeriod);
  document.addEventListener("keydown", event => { if (event.ctrlKey && event.key.toLowerCase() === "n") { event.preventDefault(); addLine(); } });
  addLine({ account: "607000", label: "Achat / charge", debit: "" }); addLine({ account: "401000", label: "Contrepartie", credit: "" });
  renderJournal(); updateTotals();
}

function addLine(data = {}) {
  const row = document.createElement("tr");
  row.innerHTML = `<td><input class="account-input" list="account-list" value="${data.account || ""}" placeholder="706000" required><datalist id="account-list">${accountOptions()}</datalist><div class="account-hint"></div></td><td><input class="line-label" list="line-label-options" value="${escapeHtml(data.label || "")}" placeholder="Libellé ou autre…"></td><td><input class="debit" value="${data.debit || ""}" placeholder="0"></td><td><input class="credit" value="${data.credit || ""}" placeholder="0"></td><td class="actions-cell"><button type="button" class="btn btn-danger">×</button></td>`;
  row.querySelectorAll("input").forEach(input => input.addEventListener("input", updateTotals));
  row.querySelector(".btn-danger").addEventListener("click", () => { row.remove(); updateTotals(); });
  document.getElementById("entry-lines").appendChild(row); updateTotals();
}

function readLines() {
  return [...document.querySelectorAll("#entry-lines tr")].map(row => ({ account: row.querySelector(".account-input").value, label: row.querySelector(".line-label").value, debit: evaluateAmount(row.querySelector(".debit").value), credit: evaluateAmount(row.querySelector(".credit").value) })).filter(line => line.account || line.debit || line.credit);
}

function updateTotals() {
  let lines = [];
  try { lines = readLines(); } catch { lines = []; }
  const totals = lines.reduce((acc, line) => ({ debit: acc.debit + line.debit, credit: acc.credit + line.credit }), { debit: 0, credit: 0 });
  document.getElementById("total-debit").textContent = money(totals.debit); document.getElementById("total-credit").textContent = money(totals.credit);
  const gap = totals.debit - totals.credit;
  const ok = Math.abs(gap) < .005 && totals.debit > 0;
  const pill = document.getElementById("balance-indicator"); pill.className = `status-pill ${ok ? "success" : "warning"}`; pill.textContent = ok ? "Équilibré — enregistrable" : `Déséquilibré mais enregistrable (${gap >= 0 ? "+" : ""}${money(gap)})`;
  document.querySelectorAll("#entry-lines tr").forEach(row => { const account = row.querySelector(".account-input").value; row.querySelector(".account-hint").textContent = account ? `${account} — ${accountLabel(account)}` : ""; });
}

function applyVat() {
  const mode = document.getElementById("vat-mode").value;
  if (mode === "none") return toast("Choisissez un mode TVA", "error");
  let customRate = null;
  try {
    customRate = mode.startsWith("custom") ? evaluateAmount(document.getElementById("vat-custom-rate").value) : null;
  } catch (error) {
    return toast(error.message, "error");
  }
  if (mode.startsWith("custom") && customRate === 0) return toast("Indiquez un taux de TVA personnalisé", "error");
  const base = readLines().find(line => line.debit || line.credit);
  if (!base) return toast("Aucune base de calcul", "error");
  const vatLines = buildVatLines(base, mode, customRate);
  if (!vatLines.length) return toast("Taux de TVA personnalisé invalide", "error");
  vatLines.forEach(line => addLine(line));
  updateTotals(); toast("Ligne TVA ajoutée");
}

function saveEntry(event) {
  event.preventDefault();
  syncEntryLabel();
  try {
    addEntry(new JournalEntry({ date: document.getElementById("entry-date").value, journal: document.getElementById("entry-code").value, reference: document.getElementById("entry-ref").value, label: document.getElementById("entry-label").value, lines: readLines() }));
    toast("Écriture enregistrée"); resetForm(); renderJournal();
  } catch (error) { toast(error.message, "error"); }
}

function resetForm() {
  document.getElementById("entry-form").reset(); document.getElementById("entry-date").valueAsDate = new Date(); document.getElementById("entry-code").value = "OD"; document.getElementById("entry-lines").innerHTML = ""; syncEntryLabel(); addLine(); addLine(); updateTotals();
}

function syncEntryLabel() {
  const preset = document.getElementById("entry-label-preset");
  const customWrap = document.getElementById("entry-label-custom-wrap");
  const customInput = document.getElementById("entry-label-custom");
  const hiddenLabel = document.getElementById("entry-label");
  const isCustom = preset.value === "custom";
  customWrap.classList.toggle("is-hidden", !isCustom);
  hiddenLabel.value = isCustom ? customInput.value.trim() : preset.value;
}

function syncVatCustomRate() {
  const mode = document.getElementById("vat-mode").value;
  const wrap = document.getElementById("vat-custom-wrap");
  wrap.classList.toggle("is-hidden", !mode.startsWith("custom"));
}

function renderJournal() {
  const entries = loadDb().entries;
  const target = document.getElementById("journal-list");
  if (!entries.length) { target.innerHTML = emptyState(); return; }
  const rows = entries.slice().reverse().map(entry => `<tr><td>${dateFr(entry.date)}</td><td>${escapeHtml(entry.journal)}</td><td>${escapeHtml(entry.reference || "—")}</td><td>${escapeHtml(entry.label)}</td><td class="money">${money(entry.lines.reduce((s, l) => s + l.debit, 0))}</td><td>${entry.locked ? "🔒" : ""}</td><td class="actions-cell"><button class="btn btn-danger" data-delete="${entry.id}" ${entry.locked ? "disabled" : ""}>Supprimer</button></td></tr>`);
  target.innerHTML = table([{ label: "Date" }, { label: "Journal" }, { label: "Réf." }, { label: "Libellé" }, { label: "Total", money: true }, { label: "Verrou" }, { label: "" }], rows);
  target.querySelectorAll("[data-delete]").forEach(button => button.addEventListener("click", async () => { if (await confirmModal({ title: "Supprimer l'écriture", message: "Un rollback sera créé avant suppression.", confirmText: "Supprimer", danger: true })) { try { deleteEntry(button.dataset.delete); toast("Écriture supprimée"); renderJournal(); } catch (error) { toast(error.message, "error"); } } }));
}

async function closePeriod() {
  const start = prompt("Date de début (AAAA-MM-JJ)"); const end = prompt("Date de fin (AAAA-MM-JJ)");
  if (!start || !end) return;
  try { lockPeriod(start, end); exportSnapshot(); toast("Période clôturée et snapshot exporté"); renderJournal(); } catch (error) { toast(error.message, "error"); }
}
