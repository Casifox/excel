import { closePeriod, downloadFile, exportJournalCsv, exportSnapshot, importSnapshot, resetDatabase, rollbackLast } from './storage.js';
import { qs, qsa, toast, modal } from './ui.js';

export function initApp() {
  setupTheme();
  setupSidebar();
  setupGlobalActions();
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      location.href = 'journal.html#new';
    }
  });
}

function setupTheme() {
  const saved = localStorage.getItem('comptaSaas.theme') || 'light';
  document.documentElement.dataset.theme = saved;
  qs('#themeToggle')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('comptaSaas.theme', next);
  });
}

function setupSidebar() {
  qs('#sidebarToggle')?.addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));
  const page = document.body.dataset.page;
  qsa('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.page === page));
}

function setupGlobalActions() {
  qs('#exportJson')?.addEventListener('click', () => {
    downloadFile(`snapshot-compta-${new Date().toISOString().slice(0, 10)}.json`, exportSnapshot());
    toast('Snapshot JSON téléchargé.');
  });
  qs('#exportCsv')?.addEventListener('click', () => {
    downloadFile(`journal-${new Date().toISOString().slice(0, 10)}.csv`, exportJournalCsv(), 'text/csv;charset=utf-8');
    toast('Journal CSV téléchargé.');
  });
  qs('#importJson')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      importSnapshot(await file.text());
      toast('Import réalisé.');
      setTimeout(() => location.reload(), 500);
    } catch (error) {
      toast(error.message, 'error');
    }
  });
  qs('#rollback')?.addEventListener('click', () => {
    try { rollbackLast(); toast('Rollback restauré.'); setTimeout(() => location.reload(), 500); }
    catch (error) { toast(error.message, 'error'); }
  });
  qs('#resetDb')?.addEventListener('click', () => {
    const body = document.createElement('p');
    body.textContent = 'Cette action vide la base locale après création d’un rollback. Continuer ?';
    modal({ title: 'Réinitialiser', body, actions: [
      { label: 'Annuler', onClick: (m) => m.remove() },
      { label: 'Réinitialiser', className: 'btn danger', onClick: () => { resetDatabase(); location.reload(); } }
    ] });
  });
  qs('#closePeriod')?.addEventListener('click', () => openClosePeriodModal());
}

function openClosePeriodModal() {
  const form = document.createElement('form');
  form.className = 'stack';
  form.innerHTML = '<label>Début<input type="date" name="start" required></label><label>Fin<input type="date" name="end" required></label><p class="muted">Les écritures incluses seront verrouillées.</p>';
  modal({ title: 'Clôture annuelle', body: form, actions: [
    { label: 'Annuler', onClick: (m) => m.remove() },
    { label: 'Clôturer', className: 'btn primary', onClick: (m) => {
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      closePeriod(data.get('start'), data.get('end'));
      toast('Période clôturée.');
      m.remove();
      setTimeout(() => location.reload(), 500);
    } }
  ] });
}

initApp();
