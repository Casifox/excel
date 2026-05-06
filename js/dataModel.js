export const ACCOUNT_PLAN = {
  "101000": "Capital social", "106000": "Réserves", "120000": "Résultat de l'exercice",
  "164000": "Emprunts auprès des établissements de crédit", "201000": "Frais d'établissement",
  "205000": "Concessions et logiciels", "218300": "Matériel de bureau et informatique",
  "275000": "Dépôts et cautionnements", "401000": "Fournisseurs", "411000": "Clients",
  "445660": "TVA déductible", "445710": "TVA collectée", "445510": "TVA à décaisser",
  "512000": "Banque", "530000": "Caisse", "606000": "Achats non stockés",
  "607000": "Achats de marchandises", "613000": "Locations", "615000": "Entretien et réparations",
  "622600": "Honoraires", "623000": "Publicité", "625000": "Déplacements, missions et réceptions",
  "626000": "Frais postaux et télécommunications", "627000": "Services bancaires",
  "641000": "Rémunérations du personnel", "645000": "Charges de sécurité sociale",
  "681000": "Dotations aux amortissements", "701000": "Ventes de produits finis",
  "706000": "Prestations de services", "707000": "Ventes de marchandises", "708000": "Produits des activités annexes"
};

const EPSILON = 0.005;
export const uid = () => `${Date.now().toString(36)}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`;
export const roundMoney = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
export const accountLabel = account => ACCOUNT_PLAN[String(account).padEnd(6, "0")] || ACCOUNT_PLAN[account] || "Compte personnalisé";

export function evaluateAmount(input) {
  if (input === null || input === undefined || String(input).trim() === "") return 0;
  const normalized = String(input).replace(/,/g, ".").replace(/\s+/g, "");
  if (!/^[0-9.+\-*/()]+$/.test(normalized)) throw new Error("Expression numérique invalide");
  const value = Function(`"use strict"; return (${normalized})`)();
  if (!Number.isFinite(value) || value < 0) throw new Error("Montant invalide");
  return roundMoney(value);
}

export class JournalEntry {
  constructor({ id = uid(), date, journal = "OD", reference = "", label, lines = [], locked = false, createdAt = new Date().toISOString() }) {
    this.id = id; this.date = date; this.journal = journal.toUpperCase(); this.reference = reference; this.label = label;
    this.lines = lines.map(line => new EntryLine(line)); this.locked = locked; this.createdAt = createdAt;
  }
  totals() {
    return this.lines.reduce((acc, line) => ({ debit: roundMoney(acc.debit + line.debit), credit: roundMoney(acc.credit + line.credit) }), { debit: 0, credit: 0 });
  }
  isBalanced() { const totals = this.totals(); return Math.abs(totals.debit - totals.credit) < EPSILON && totals.debit > 0; }
  validate(closures = []) {
    if (!this.date || !this.label) throw new Error("Date et libellé sont obligatoires");
    if (this.lines.length < 2) throw new Error("Une écriture requiert au moins deux lignes");
    if (closures.some(period => this.date >= period.start && this.date <= period.end)) throw new Error("Cette période est clôturée");
    this.lines.forEach(line => line.validate());
    if (!this.isBalanced()) throw new Error("L'écriture n'est pas équilibrée");
    return true;
  }
}

export class EntryLine {
  constructor({ account, label = "", debit = 0, credit = 0 }) {
    this.account = String(account || "").trim(); this.label = label; this.debit = roundMoney(debit); this.credit = roundMoney(credit);
  }
  validate() {
    if (!/^\d{3,8}$/.test(this.account)) throw new Error(`Compte invalide : ${this.account}`);
    if (this.debit > 0 && this.credit > 0) throw new Error("Une ligne ne peut pas avoir débit et crédit");
    if (this.debit === 0 && this.credit === 0) throw new Error("Chaque ligne doit porter un montant");
  }
}

export function buildVatLines(baseLine, mode) {
  const config = {
    sale20: { rate: .20, account: "445710", side: "credit" }, purchase20: { rate: .20, account: "445660", side: "debit" },
    sale10: { rate: .10, account: "445710", side: "credit" }, purchase10: { rate: .10, account: "445660", side: "debit" }
  }[mode];
  if (!config) return [];
  const base = Math.max(baseLine.debit, baseLine.credit);
  const vat = roundMoney(base * config.rate);
  return [{ account: config.account, label: `TVA ${Math.round(config.rate * 100)}%`, debit: config.side === "debit" ? vat : 0, credit: config.side === "credit" ? vat : 0 }];
}

export function flattenLines(entries) { return entries.flatMap(entry => entry.lines.map(line => ({ ...line, entryId: entry.id, date: entry.date, journal: entry.journal, reference: entry.reference, entryLabel: entry.label }))); }

export function computeBalance(entries) {
  const map = new Map();
  flattenLines(entries).forEach(line => {
    const current = map.get(line.account) || { account: line.account, label: accountLabel(line.account), debit: 0, credit: 0 };
    current.debit = roundMoney(current.debit + line.debit); current.credit = roundMoney(current.credit + line.credit);
    current.debitBalance = Math.max(roundMoney(current.debit - current.credit), 0);
    current.creditBalance = Math.max(roundMoney(current.credit - current.debit), 0);
    map.set(line.account, current);
  });
  return [...map.values()].sort((a, b) => a.account.localeCompare(b.account));
}

export function computeResult(entries) {
  const balance = computeBalance(entries);
  const products = balance.filter(row => row.account.startsWith("7")).map(row => ({ ...row, amount: row.creditBalance - row.debitBalance }));
  const expenses = balance.filter(row => row.account.startsWith("6")).map(row => ({ ...row, amount: row.debitBalance - row.creditBalance }));
  const totalProducts = roundMoney(products.reduce((s, r) => s + r.amount, 0));
  const totalExpenses = roundMoney(expenses.reduce((s, r) => s + r.amount, 0));
  return { products, expenses, totalProducts, totalExpenses, result: roundMoney(totalProducts - totalExpenses) };
}

export function computeBalanceSheet(entries) {
  const rows = computeBalance(entries);
  const assets = rows.filter(r => /^[2345]/.test(r.account) && r.debitBalance > 0).map(r => ({ ...r, amount: r.debitBalance }));
  const liabilities = rows.filter(r => r.account.startsWith("1") || r.creditBalance > 0).map(r => ({ ...r, amount: r.creditBalance }));
  const result = computeResult(entries).result;
  if (result > 0) liabilities.push({ account: "120000", label: "Résultat bénéficiaire", amount: result });
  if (result < 0) assets.push({ account: "129000", label: "Résultat déficitaire", amount: Math.abs(result) });
  return { assets, liabilities, totalAssets: roundMoney(assets.reduce((s, r) => s + r.amount, 0)), totalLiabilities: roundMoney(liabilities.reduce((s, r) => s + r.amount, 0)) };
}

export function monthlySeries(entries) {
  const months = [...Array(12)].map((_, index) => `${new Date().getFullYear()}-${String(index + 1).padStart(2, "0")}`);
  return months.map(month => {
    const scoped = entries.filter(entry => entry.date?.startsWith(month));
    const result = computeResult(scoped);
    return { month, revenue: result.totalProducts, expenses: result.totalExpenses };
  });
}
