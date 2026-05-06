import { JournalEntry } from "./dataModel.js";

const DB_KEY = "comptaSaas.db.v1";
const ROLLBACK_KEY = "comptaSaas.rollback.v1";
const defaultDb = () => ({ entries: [], closures: [], settings: { theme: "light" }, updatedAt: new Date().toISOString() });

export function loadDb() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return defaultDb();
  try {
    const parsed = JSON.parse(raw);
    return { ...defaultDb(), ...parsed, entries: (parsed.entries || []).map(entry => new JournalEntry(entry)) };
  } catch {
    return defaultDb();
  }
}

export function saveDb(db) {
  const payload = { ...db, updatedAt: new Date().toISOString() };
  localStorage.setItem(DB_KEY, JSON.stringify(payload));
  return payload;
}

export function createSnapshot(reason = "manual") {
  const snapshot = { reason, createdAt: new Date().toISOString(), data: loadDb() };
  localStorage.setItem(ROLLBACK_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export function restoreRollback() {
  const raw = localStorage.getItem(ROLLBACK_KEY);
  if (!raw) throw new Error("Aucun rollback disponible");
  const snapshot = JSON.parse(raw);
  saveDb(snapshot.data);
  return snapshot;
}

export function addEntry(entry) {
  const db = loadDb();
  const model = new JournalEntry(entry);
  model.validate(db.closures);
  db.entries.push(model);
  return saveDb(db);
}

export function updateEntry(id, patch) {
  const db = loadDb();
  const index = db.entries.findIndex(item => item.id === id);
  if (index === -1) throw new Error("Écriture introuvable");
  if (db.entries[index].locked) throw new Error("Écriture verrouillée");
  createSnapshot("before-update");
  const model = new JournalEntry({ ...db.entries[index], ...patch, id });
  model.validate(db.closures);
  db.entries[index] = model;
  return saveDb(db);
}

export function deleteEntry(id) {
  const db = loadDb();
  const entry = db.entries.find(item => item.id === id);
  if (!entry) throw new Error("Écriture introuvable");
  if (entry.locked) throw new Error("Écriture verrouillée");
  createSnapshot("before-delete");
  db.entries = db.entries.filter(item => item.id !== id);
  return saveDb(db);
}

export function lockPeriod(start, end) {
  if (!start || !end || start > end) throw new Error("Période invalide");
  const db = loadDb();
  createSnapshot("before-period-lock");
  db.closures.push({ start, end, createdAt: new Date().toISOString() });
  db.entries = db.entries.map(entry => ({ ...entry, locked: entry.date >= start && entry.date <= end ? true : entry.locked }));
  return saveDb(db);
}

export function exportSnapshot() {
  const blob = new Blob([JSON.stringify(loadDb(), null, 2)], { type: "application/json" });
  downloadBlob(blob, `snapshot-compta-${new Date().toISOString().slice(0, 10)}.json`);
}

export function importSnapshot(file) {
  return file.text().then(text => {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.entries)) throw new Error("Snapshot invalide");
    createSnapshot("before-import");
    return saveDb({ ...defaultDb(), ...parsed });
  });
}

export function exportJournalCsv() {
  const rows = [["Date", "Journal", "Référence", "Libellé", "Compte", "Libellé ligne", "Débit", "Crédit"]];
  loadDb().entries.forEach(entry => entry.lines.forEach(line => rows.push([entry.date, entry.journal, entry.reference, entry.label, line.account, line.label, line.debit, line.credit])));
  const csv = rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `journal-${new Date().toISOString().slice(0, 10)}.csv`);
}

export function setTheme(theme) { const db = loadDb(); db.settings.theme = theme; saveDb(db); }

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}
