import { APP_VERSION, DEFAULT_COMPANY, JournalEntry, validateEntry } from './dataModel.js';

const DB_KEY = 'comptaSaas.db.v1';
const ROLLBACK_KEY = 'comptaSaas.rollback.v1';

export function createEmptyDatabase() {
  return { version: APP_VERSION, company: { ...DEFAULT_COMPANY }, entries: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export function loadDatabase() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return createEmptyDatabase();
  try {
    return { ...createEmptyDatabase(), ...JSON.parse(raw) };
  } catch {
    return createEmptyDatabase();
  }
}

export function saveDatabase(db) {
  const next = { ...db, updatedAt: new Date().toISOString() };
  localStorage.setItem(DB_KEY, JSON.stringify(next));
  return next;
}

export function snapshotRollback(reason = 'rollback') {
  const db = loadDatabase();
  localStorage.setItem(ROLLBACK_KEY, JSON.stringify({ reason, date: new Date().toISOString(), db }));
}

export function rollbackLast() {
  const raw = localStorage.getItem(ROLLBACK_KEY);
  if (!raw) throw new Error('Aucun rollback disponible.');
  const rollback = JSON.parse(raw);
  saveDatabase(rollback.db);
  return rollback.db;
}

export function listEntries() {
  return loadDatabase().entries.sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`));
}

export function getEntry(id) {
  return loadDatabase().entries.find((entry) => entry.id === id);
}

export function upsertEntry(entry) {
  const db = loadDatabase();
  const prepared = entry instanceof JournalEntry ? entry : new JournalEntry(entry);
  const validation = validateEntry(prepared, db.company);
  if (!validation.valid) throw new Error(validation.errors.join('\n'));
  const index = db.entries.findIndex((item) => item.id === prepared.id);
  validation.normalized.updatedAt = new Date().toISOString();
  if (index >= 0) db.entries[index] = { ...db.entries[index], ...validation.normalized };
  else db.entries.push(validation.normalized);
  return saveDatabase(db);
}

export function deleteEntry(id) {
  const db = loadDatabase();
  const target = db.entries.find((entry) => entry.id === id);
  if (target?.locked) throw new Error('Cette écriture est verrouillée.');
  snapshotRollback('Suppression écriture');
  db.entries = db.entries.filter((entry) => entry.id !== id);
  return saveDatabase(db);
}

export function updateCompany(company) {
  const db = loadDatabase();
  db.company = { ...db.company, ...company };
  return saveDatabase(db);
}

export function closePeriod(start, end) {
  const db = loadDatabase();
  snapshotRollback('Clôture annuelle');
  db.company.closedPeriods = [...(db.company.closedPeriods || []), { start, end, closedAt: new Date().toISOString() }];
  db.entries = db.entries.map((entry) => entry.date >= start && entry.date <= end ? { ...entry, locked: true } : entry);
  return saveDatabase(db);
}

export function exportSnapshot() {
  return JSON.stringify(loadDatabase(), null, 2);
}

export function importSnapshot(json) {
  const parsed = JSON.parse(json);
  if (!parsed || !Array.isArray(parsed.entries)) throw new Error('Fichier JSON invalide.');
  snapshotRollback('Import JSON');
  return saveDatabase({ ...createEmptyDatabase(), ...parsed, version: APP_VERSION });
}

export function resetDatabase() {
  snapshotRollback('Réinitialisation');
  return saveDatabase(createEmptyDatabase());
}

export function exportJournalCsv(entries = listEntries()) {
  const rows = [['Date', 'Référence', 'Libellé écriture', 'Compte', 'Libellé ligne', 'Débit', 'Crédit', 'Verrouillée']];
  entries.forEach((entry) => entry.lines.forEach((line) => rows.push([
    entry.date, entry.reference, entry.memo, line.account, line.label, line.debit, line.credit, entry.locked ? 'Oui' : 'Non'
  ])));
  return rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(';')).join('\n');
}

export function downloadFile(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
