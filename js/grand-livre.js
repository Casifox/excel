import { accountLabel, roundMoney } from './dataModel.js';
import { listEntries } from './storage.js';
import { emptyState, formatMoney, qs, renderTable } from './ui.js';

function initLedger() {
  const entries = listEntries().sort((a, b) => a.date.localeCompare(b.date));
  const host = qs('#ledgerTable');
  if (!entries.length) return host.append(emptyState({ title: 'Grand livre vide', text: 'Aucun mouvement comptable à afficher.', onAction: () => location.href = 'journal.html#new' }));
  const rows = [];
  const running = new Map();
  entries.forEach((entry) => entry.lines.forEach((line) => {
    const balance = roundMoney((running.get(line.account) || 0) + line.debit - line.credit);
    running.set(line.account, balance);
    rows.push({ date: entry.date, ref: entry.reference, account: line.account, accountLabel: accountLabel(line.account), label: line.label || entry.memo, debit: line.debit, credit: line.credit, balance });
  }));
  renderTable(host, [
    { label: 'Date', key: 'date' }, { label: 'Réf.', key: 'ref' }, { label: 'Compte', key: 'account' }, { label: 'Intitulé', key: 'accountLabel' }, { label: 'Libellé', key: 'label' },
    { label: 'Débit', render: (r) => formatMoney(r.debit) }, { label: 'Crédit', render: (r) => formatMoney(r.credit) }, { label: 'Solde', render: (r) => formatMoney(r.balance) }
  ], rows);
}
initLedger();
