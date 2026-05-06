import { computeBalanceSheet } from './dataModel.js';
import { listEntries } from './storage.js';
import { emptyState, formatMoney, qs, renderTable } from './ui.js';

function initSheet() {
  const entries = listEntries();
  const host = qs('#sheetContent');
  if (!entries.length) return host.append(emptyState({ title: 'Bilan vide', text: 'Le bilan sera calculé dès les premières écritures équilibrées.', onAction: () => location.href = 'journal.html#new' }));
  const sheet = computeBalanceSheet(entries);
  qs('#totalAssets').textContent = formatMoney(sheet.totalAssets);
  qs('#totalLiabilities').textContent = formatMoney(sheet.totalLiabilities);
  qs('#balanceGap').textContent = formatMoney(sheet.gap);
  renderTable(qs('#assetsTable'), [{ label: 'Compte', key: 'account' }, { label: 'Actif', key: 'label' }, { label: 'Montant', render: (r) => formatMoney(r.amount) }], sheet.assets);
  renderTable(qs('#liabilitiesTable'), [{ label: 'Compte', key: 'account' }, { label: 'Passif', key: 'label' }, { label: 'Montant', render: (r) => formatMoney(r.amount) }], sheet.liabilities);
}
initSheet();
