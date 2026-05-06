import { aggregateBalance, computeIncomeStatement } from './dataModel.js';
import { listEntries } from './storage.js';
import { emptyState, formatMoney, qs, renderTable } from './ui.js';

function initResult() {
  const entries = listEntries();
  const host = qs('#resultContent');
  if (!entries.length) return host.append(emptyState({ title: 'Compte de résultat vide', text: 'Les produits et charges apparaîtront automatiquement.', onAction: () => location.href = 'journal.html#new' }));
  const statement = computeIncomeStatement(entries);
  qs('#productsTotal').textContent = formatMoney(statement.products);
  qs('#chargesTotal').textContent = formatMoney(statement.charges);
  qs('#netResult').textContent = formatMoney(statement.result);
  const balance = aggregateBalance(entries);
  renderTable(qs('#chargesTable'), [{ label: 'Compte', key: 'account' }, { label: 'Charge', key: 'label' }, { label: 'Montant', render: (r) => formatMoney(r.debit - r.credit) }], balance.filter((r) => r.account.startsWith('6')));
  renderTable(qs('#productsTable'), [{ label: 'Compte', key: 'account' }, { label: 'Produit', key: 'label' }, { label: 'Montant', render: (r) => formatMoney(r.credit - r.debit) }], balance.filter((r) => r.account.startsWith('7')));
}
initResult();
