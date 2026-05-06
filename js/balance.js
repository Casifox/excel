import { aggregateBalance } from './dataModel.js';
import { listEntries } from './storage.js';
import { emptyState, formatMoney, qs, renderTable } from './ui.js';

function initBalance() {
  const entries = listEntries();
  const host = qs('#balanceTable');
  if (!entries.length) return host.append(emptyState({ title: 'Balance vide', text: 'Ajoutez des écritures pour agréger les comptes.', onAction: () => location.href = 'journal.html#new' }));
  const rows = aggregateBalance(entries);
  renderTable(host, [
    { label: 'Compte', key: 'account' },
    { label: 'Libellé', key: 'label' },
    { label: 'Débit', render: (r) => formatMoney(r.debit) },
    { label: 'Crédit', render: (r) => formatMoney(r.credit) },
    { label: 'Solde débiteur', render: (r) => formatMoney(r.debitBalance) },
    { label: 'Solde créditeur', render: (r) => formatMoney(r.creditBalance) }
  ], rows);
}
initBalance();
