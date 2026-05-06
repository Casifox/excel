import { JournalEntry, accountLabel, calculateVatLines, todayISO, totalLines, validateEntry } from './dataModel.js';
import { deleteEntry, getEntry, listEntries, upsertEntry } from './storage.js';
import { attachAccountAutocomplete, attachAmountEvaluator, emptyState, formatMoney, qs, qsa, toast } from './ui.js';

const form = qs('#entryForm');
const linesBody = qs('#linesBody');
let editingId = null;

function initJournal() {
  renderEntries();
  resetForm();
  qs('#addLine')?.addEventListener('click', () => addLine());
  qs('#vatAssistant')?.addEventListener('click', applyVatAssistant);
  form?.addEventListener('submit', saveEntry);
  qs('#newEntry')?.addEventListener('click', resetForm);
  if (location.hash === '#new') qs('#entryCard')?.scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
  editingId = null;
  form?.reset();
  qs('[name="date"]').value = todayISO();
  linesBody.innerHTML = '';
  addLine({ account: '512000' });
  addLine();
  updateTotals();
}

function addLine(line = {}) {
  const tr = document.createElement('tr');
  tr.innerHTML = `<td class="account-cell"><input name="account" value="${line.account || ''}" placeholder="Compte"></td><td><input name="label" value="${line.label || ''}" placeholder="Libellé"></td><td><input class="amount" name="debit" value="${line.debit || ''}" placeholder="0"></td><td><input class="amount" name="credit" value="${line.credit || ''}" placeholder="0"></td><td><button type="button" class="icon-btn danger" data-remove>×</button></td>`;
  linesBody.append(tr);
  attachAccountAutocomplete(qs('[name="account"]', tr));
  qsa('.amount', tr).forEach(attachAmountEvaluator);
  tr.addEventListener('input', updateTotals);
  tr.addEventListener('change', (event) => {
    if (event.target.name === 'account' && !qs('[name="label"]', tr).value) qs('[name="label"]', tr).value = accountLabel(event.target.value);
    updateTotals();
  });
  qs('[data-remove]', tr).addEventListener('click', () => { tr.remove(); updateTotals(); });
}

function formToEntry() {
  const data = new FormData(form);
  return new JournalEntry({
    id: editingId || undefined,
    date: data.get('date'),
    reference: data.get('reference'),
    memo: data.get('memo'),
    lines: qsa('#linesBody tr').map((tr) => ({
      account: qs('[name="account"]', tr).value.trim(),
      label: qs('[name="label"]', tr).value.trim(),
      debit: qs('[name="debit"]', tr).value,
      credit: qs('[name="credit"]', tr).value
    })).filter((line) => line.account || line.debit || line.credit)
  });
}

function updateTotals() {
  const entry = formToEntry();
  const totals = totalLines(entry.lines);
  qs('#debitTotal').textContent = formatMoney(totals.debit);
  qs('#creditTotal').textContent = formatMoney(totals.credit);
  const diff = Math.round((totals.debit - totals.credit) * 100) / 100;
  const status = qs('#balanceStatus');
  status.textContent = diff === 0 && totals.debit > 0 ? 'Prêt à enregistrer' : `Déséquilibré: ${formatMoney(diff)}`;
  status.className = `pill ${diff === 0 && totals.debit > 0 ? 'ok' : 'bad'}`;
}

function saveEntry(event) {
  event.preventDefault();
  const entry = formToEntry();
  const validation = validateEntry(entry);
  if (!validation.valid) return toast(validation.errors.join(' '), 'error');
  try {
    upsertEntry(entry);
    toast('Écriture enregistrée.');
    resetForm();
    renderEntries();
  } catch (error) {
    toast(error.message, 'error');
  }
}

function renderEntries() {
  const entries = listEntries();
  const host = qs('#journalList');
  if (!entries.length) {
    host.innerHTML = '';
    host.append(emptyState({ title: 'Journal vierge', text: 'Aucune donnée de test. Commencez par créer votre première écriture.', onAction: () => qs('#entryCard').scrollIntoView({ behavior: 'smooth' }) }));
    return;
  }
  host.innerHTML = entries.map((entry) => `<article class="entry-row"><div><strong>${entry.date}</strong><span>${entry.reference || 'Sans référence'} · ${entry.memo || 'Sans libellé'}</span></div><div>${formatMoney(totalLines(entry.lines).debit)}</div><div class="row-actions"><button data-edit="${entry.id}" class="btn small">Modifier</button><button data-delete="${entry.id}" class="btn small danger" ${entry.locked ? 'disabled' : ''}>Supprimer</button></div></article>`).join('');
  host.addEventListener('click', handleListClick, { once: true });
}

function handleListClick(event) {
  const edit = event.target.closest('[data-edit]');
  const del = event.target.closest('[data-delete]');
  if (edit) loadEntry(edit.dataset.edit);
  if (del) {
    try { deleteEntry(del.dataset.delete); toast('Écriture supprimée.'); renderEntries(); }
    catch (error) { toast(error.message, 'error'); }
  }
  qs('#journalList')?.addEventListener('click', handleListClick, { once: true });
}

function loadEntry(id) {
  const entry = getEntry(id);
  if (!entry) return;
  editingId = entry.id;
  qs('[name="date"]').value = entry.date;
  qs('[name="reference"]').value = entry.reference;
  qs('[name="memo"]').value = entry.memo;
  linesBody.innerHTML = '';
  entry.lines.forEach(addLine);
  updateTotals();
  qs('#entryCard').scrollIntoView({ behavior: 'smooth' });
}

function applyVatAssistant() {
  const direction = qs('#vatDirection').value;
  const amountHt = qs('#vatBase').value;
  const rate = qs('#vatRate').value;
  const baseAccount = qs('#vatAccount').value;
  const lines = calculateVatLines({ direction, amountHt, rate, baseAccount });
  if (!lines.length) return toast('TVA impossible à calculer.', 'error');
  linesBody.innerHTML = '';
  lines.forEach(addLine);
  updateTotals();
  toast('Lignes TVA générées.');
}

initJournal();
