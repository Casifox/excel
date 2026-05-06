export const APP_VERSION = '1.0.0';

export const ACCOUNT_PLAN = {
  '101000': 'Capital social ou individuel',
  '106100': 'Réserve légale',
  '108000': "Compte de l'exploitant",
  '120000': "Résultat de l'exercice (bénéfice)",
  '129000': "Résultat de l'exercice (perte)",
  '164000': 'Emprunts auprès des établissements de crédit',
  '201000': "Frais d'établissement",
  '205000': 'Concessions, brevets, licences',
  '213000': 'Constructions',
  '215400': 'Matériel industriel',
  '218300': 'Matériel de bureau et informatique',
  '218400': 'Mobilier',
  '280500': 'Amortissements des concessions et brevets',
  '281830': 'Amortissements matériel de bureau',
  '401000': 'Fournisseurs',
  '411000': 'Clients',
  '421000': 'Personnel - Rémunérations dues',
  '431000': 'Sécurité sociale',
  '445510': 'TVA à décaisser',
  '445620': 'TVA déductible sur immobilisations',
  '445660': 'TVA déductible sur autres biens et services',
  '445710': 'TVA collectée',
  '512000': 'Banque',
  '530000': 'Caisse',
  '580000': 'Virements internes',
  '601000': 'Achats stockés - matières premières',
  '606100': 'Fournitures non stockables',
  '606300': "Fournitures d'entretien et petit équipement",
  '606400': 'Fournitures administratives',
  '607000': 'Achats de marchandises',
  '613200': 'Locations immobilières',
  '615000': 'Entretien et réparations',
  '616000': "Primes d'assurances",
  '622600': 'Honoraires',
  '623000': 'Publicité, publications, relations publiques',
  '625100': 'Voyages et déplacements',
  '626000': 'Frais postaux et télécommunications',
  '627000': 'Services bancaires',
  '641000': 'Rémunérations du personnel',
  '645000': 'Charges de sécurité sociale',
  '706000': 'Prestations de services',
  '707000': 'Ventes de marchandises',
  '708500': 'Ports et frais accessoires facturés',
  '758000': 'Produits divers de gestion courante'
};

export const DEFAULT_COMPANY = {
  name: 'Entreprise',
  currency: 'EUR',
  fiscalYearStart: '01-01',
  vatRates: [0, 5.5, 10, 20],
  closedPeriods: []
};

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function parseAmount(input) {
  if (typeof input === 'number') return roundMoney(input);
  const raw = String(input ?? '').trim().replace(',', '.');
  if (!raw) return 0;
  if (!/^[0-9+\-*/().\s]+$/.test(raw)) return Number.NaN;
  try {
    const result = Function(`"use strict"; return (${raw});`)();
    return Number.isFinite(result) ? roundMoney(result) : Number.NaN;
  } catch {
    return Number.NaN;
  }
}

export function accountLabel(number) {
  return ACCOUNT_PLAN[number] || '';
}

export function accountOptions(query = '') {
  const q = query.toLowerCase().trim();
  return Object.entries(ACCOUNT_PLAN)
    .filter(([number, label]) => !q || number.includes(q) || label.toLowerCase().includes(q))
    .map(([number, label]) => ({ number, label }))
    .slice(0, 12);
}

export function isPeriodClosed(date, company = DEFAULT_COMPANY) {
  if (!date) return false;
  return (company.closedPeriods || []).some((period) => date >= period.start && date <= period.end);
}

export function calculateVatLines({ baseAccount, amountHt, rate, direction }) {
  const ht = parseAmount(amountHt);
  const vatRate = parseAmount(rate);
  if (!Number.isFinite(ht) || !Number.isFinite(vatRate) || ht <= 0 || vatRate <= 0) return [];
  const vat = roundMoney(ht * vatRate / 100);
  const ttc = roundMoney(ht + vat);
  const isSale = direction === 'sale';
  return [
    { account: baseAccount || (isSale ? '706000' : '606400'), label: isSale ? 'Vente HT' : 'Achat HT', debit: isSale ? 0 : ht, credit: isSale ? ht : 0 },
    { account: isSale ? '445710' : '445660', label: isSale ? 'TVA collectée' : 'TVA déductible', debit: isSale ? 0 : vat, credit: isSale ? vat : 0 },
    { account: isSale ? '411000' : '401000', label: isSale ? 'Client TTC' : 'Fournisseur TTC', debit: isSale ? ttc : 0, credit: isSale ? 0 : ttc }
  ];
}

export function validateEntry(entry, company = DEFAULT_COMPANY) {
  const errors = [];
  if (!entry.date) errors.push('La date est obligatoire.');
  if (isPeriodClosed(entry.date, company)) errors.push('La période de cette écriture est clôturée.');
  if (!entry.lines || entry.lines.length < 2) errors.push('Une écriture doit contenir au moins deux lignes.');
  const normalizedLines = (entry.lines || []).map((line, index) => {
    const debit = parseAmount(line.debit);
    const credit = parseAmount(line.credit);
    if (!line.account || !/^\d{3,8}$/.test(String(line.account))) errors.push(`Ligne ${index + 1}: compte invalide.`);
    if (!Number.isFinite(debit) || !Number.isFinite(credit)) errors.push(`Ligne ${index + 1}: montant invalide.`);
    if (debit > 0 && credit > 0) errors.push(`Ligne ${index + 1}: débit et crédit ne peuvent pas être saisis ensemble.`);
    if (debit <= 0 && credit <= 0) errors.push(`Ligne ${index + 1}: renseigner un débit ou un crédit.`);
    return { ...line, debit: roundMoney(debit), credit: roundMoney(credit), label: line.label || accountLabel(line.account) };
  });
  const totals = totalLines(normalizedLines);
  if (roundMoney(totals.debit - totals.credit) !== 0) errors.push('L’écriture n’est pas équilibrée.');
  return { valid: errors.length === 0, errors, normalized: { ...entry, lines: normalizedLines } };
}

export function totalLines(lines = []) {
  return lines.reduce((acc, line) => {
    acc.debit = roundMoney(acc.debit + parseAmount(line.debit));
    acc.credit = roundMoney(acc.credit + parseAmount(line.credit));
    return acc;
  }, { debit: 0, credit: 0 });
}

export function aggregateBalance(entries = []) {
  const accounts = new Map();
  entries.forEach((entry) => {
    entry.lines.forEach((line) => {
      const current = accounts.get(line.account) || { account: line.account, label: accountLabel(line.account) || line.label || '', debit: 0, credit: 0 };
      current.debit = roundMoney(current.debit + parseAmount(line.debit));
      current.credit = roundMoney(current.credit + parseAmount(line.credit));
      accounts.set(line.account, current);
    });
  });
  return [...accounts.values()].sort((a, b) => a.account.localeCompare(b.account)).map((row) => ({
    ...row,
    debitBalance: Math.max(roundMoney(row.debit - row.credit), 0),
    creditBalance: Math.max(roundMoney(row.credit - row.debit), 0)
  }));
}

export function computeIncomeStatement(entries = []) {
  const balance = aggregateBalance(entries);
  const charges = balance.filter((r) => r.account.startsWith('6')).reduce((s, r) => roundMoney(s + r.debit - r.credit), 0);
  const products = balance.filter((r) => r.account.startsWith('7')).reduce((s, r) => roundMoney(s + r.credit - r.debit), 0);
  return { products, charges, result: roundMoney(products - charges) };
}

export function computeBalanceSheet(entries = []) {
  const balance = aggregateBalance(entries);
  const assets = [];
  const liabilities = [];
  balance.forEach((row) => {
    const net = roundMoney(row.debit - row.credit);
    const first = row.account[0];
    if (['2', '3', '5'].includes(first) || (first === '4' && net >= 0)) assets.push({ ...row, amount: Math.abs(net) });
    if (first === '1' || (first === '4' && net < 0)) liabilities.push({ ...row, amount: Math.abs(net) });
  });
  const income = computeIncomeStatement(entries).result;
  if (income >= 0) liabilities.push({ account: '120000', label: 'Résultat bénéficiaire', amount: income });
  else assets.push({ account: '129000', label: 'Résultat déficitaire', amount: Math.abs(income) });
  const totalAssets = roundMoney(assets.reduce((s, r) => s + r.amount, 0));
  const totalLiabilities = roundMoney(liabilities.reduce((s, r) => s + r.amount, 0));
  return { assets, liabilities, totalAssets, totalLiabilities, gap: roundMoney(totalAssets - totalLiabilities) };
}

export class JournalEntry {
  constructor({ id = uid('entry'), date = todayISO(), reference = '', memo = '', locked = false, lines = [] } = {}) {
    this.id = id;
    this.date = date;
    this.reference = reference;
    this.memo = memo;
    this.locked = locked;
    this.lines = lines;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }
}
