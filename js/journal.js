/**
 * ============================================
 * JOURNAL.JS - Gestion du journal comptable
 * ============================================
 * Page de saisie des écritures comptables
 */

let currentEntries = [];
let filteredEntries = [];

/**
 * Initialise la page du journal
 */
function initJournal() {
  console.log('Initialisation du journal...');
  
  // Charge les entrées
  currentEntries = [...AppData.entries];
  filteredEntries = [...currentEntries];
  
  // Affiche le tableau
  renderJournalTable();
  
  // Configure les écouteurs d'événements
  setupEventListeners();
  
  // Met à jour les totaux
  updateTotals();
}

/**
 * Configure les écouteurs d'événements
 */
function setupEventListeners() {
  // Bouton ajouter ligne
  const btnAddLine = document.getElementById('btn-add-line');
  if (btnAddLine) {
    btnAddLine.addEventListener('click', addNewLine);
  }
  
  // Bouton exporter CSV
  const btnExportCSV = document.getElementById('btn-export-csv');
  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', () => {
      Utils.exportToCSV(filteredEntries, 'journal_compta.csv');
    });
  }
  
  // Bouton réinitialiser
  const btnReset = document.getElementById('btn-reset-data');
  if (btnReset) {
    btnReset.addEventListener('click', resetAllData);
  }
  
  // Recherche
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
  
  // Filtre date début
  const dateStart = document.getElementById('date-start');
  if (dateStart) {
    dateStart.addEventListener('change', handleDateFilter);
  }
  
  // Filtre date fin
  const dateEnd = document.getElementById('date-end');
  if (dateEnd) {
    dateEnd.addEventListener('change', handleDateFilter);
  }
  
  // Délégation d'événements pour le tableau
  const journalTableBody = document.getElementById('journal-table-body');
  if (journalTableBody) {
    journalTableBody.addEventListener('click', handleTableClick);
    journalTableBody.addEventListener('blur', handleCellBlur, true);
    journalTableBody.addEventListener('keypress', handleCellKeypress, true);
  }
}

/**
 * Affiche le tableau du journal
 */
function renderJournalTable() {
  const tbody = document.getElementById('journal-table-body');
  if (!tbody) return;
  
  // Trie par date
  const sortedEntries = Utils.sortByDate(filteredEntries);
  
  let html = '';
  
  sortedEntries.forEach(entry => {
    html += `
      <tr data-id="${entry.id}">
        <td class="editable-cell" data-field="date">
          <input type="date" value="${entry.date}" />
        </td>
        <td class="editable-cell" data-field="journal">
          <select value="${entry.journal}">
            <option value="ACH" ${entry.journal === 'ACH' ? 'selected' : ''}>ACH</option>
            <option value="VEN" ${entry.journal === 'VEN' ? 'selected' : ''}>VEN</option>
            <option value="BAN" ${entry.journal === 'BAN' ? 'selected' : ''}>BAN</option>
            <option value="CAI" ${entry.journal === 'CAI' ? 'selected' : ''}>CAI</option>
            <option value="OD" ${entry.journal === 'OD' ? 'selected' : ''}>OD</option>
          </select>
        </td>
        <td class="editable-cell" data-field="account">
          <input type="text" value="${entry.account}" placeholder="N° compte" />
        </td>
        <td class="editable-cell" data-field="label">
          <input type="text" value="${entry.label}" placeholder="Libellé" />
        </td>
        <td class="editable-cell text-right" data-field="debit">
          <input type="number" step="0.01" min="0" value="${entry.debit.toFixed(2)}" />
        </td>
        <td class="editable-cell text-right" data-field="credit">
          <input type="number" step="0.01" min="0" value="${entry.credit.toFixed(2)}" />
        </td>
        <td class="text-center">
          <button class="btn btn-danger btn-sm btn-delete" data-id="${entry.id}">
            🗑️
          </button>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
  
  // Si aucune entrée
  if (sortedEntries.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="padding: 40px;">
          <p style="color: #7f8c8d; font-size: 1.1rem;">Aucune écriture dans le journal</p>
          <p style="color: #95a5a6; margin-top: 10px;">Cliquez sur "Ajouter une ligne" pour commencer</p>
        </td>
      </tr>
    `;
  }
}

/**
 * Ajoute une nouvelle ligne vide
 */
function addNewLine() {
  const today = new Date().toISOString().split('T')[0];
  
  const newEntry = {
    id: Utils.generateId(),
    date: today,
    journal: 'OD',
    account: '',
    label: '',
    debit: 0,
    credit: 0
  };
  
  AppData.entries.push(newEntry);
  saveAllData();
  
  // Rafraîchit l'affichage
  currentEntries = [...AppData.entries];
  applyFilters();
  renderJournalTable();
  updateTotals();
  
  Utils.showAlert('Ligne ajoutée avec succès');
}

/**
 * Gère les clics dans le tableau
 */
function handleTableClick(event) {
  // Bouton supprimer
  if (event.target.classList.contains('btn-delete')) {
    const id = event.target.getAttribute('data-id');
    deleteEntryById(id);
  }
}

/**
 * Supprime une entrée par son ID
 */
function deleteEntryById(id) {
  if (confirm('Voulez-vous vraiment supprimer cette écriture ?')) {
    deleteEntry(id);
    currentEntries = [...AppData.entries];
    applyFilters();
    renderJournalTable();
    updateTotals();
    Utils.showAlert('Écriture supprimée', 'warning');
  }
}

/**
 * Gère la perte de focus sur une cellule
 */
function handleCellBlur(event) {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
    const cell = event.target.closest('.editable-cell');
    const row = event.target.closest('tr');
    
    if (!cell || !row) return;
    
    const field = cell.getAttribute('data-field');
    const id = row.getAttribute('data-id');
    const value = event.target.value;
    
    // Met à jour l'entrée
    updateEntryField(id, field, value);
  }
}

/**
 * Gère la touche Entrée dans les cellules
 */
function handleCellKeypress(event) {
  if (event.key === 'Enter') {
    event.target.blur();
  }
}

/**
 * Met à jour un champ d'une entrée
 */
function updateEntryField(id, field, value) {
  const index = AppData.entries.findIndex(e => e.id === id);
  if (index === -1) return;
  
  let parsedValue = value;
  
  // Parse les nombres pour débit/crédit
  if (field === 'debit' || field === 'credit') {
    parsedValue = parseFloat(value) || 0;
  }
  
  AppData.entries[index][field] = parsedValue;
  saveAllData();
  
  // Met à jour les totaux
  updateTotals();
}

/**
 * Gère la recherche
 */
function handleSearch(event) {
  const query = event.target.value;
  filteredEntries = Utils.search(currentEntries, query);
  applyDateFilter();
  renderJournalTable();
}

/**
 * Gère le filtre par date
 */
function handleDateFilter() {
  applyFilters();
  renderJournalTable();
}

/**
 * Applique tous les filtres
 */
function applyFilters() {
  let result = [...currentEntries];
  
  // Filtre recherche
  const searchInput = document.getElementById('search-input');
  if (searchInput && searchInput.value) {
    result = Utils.search(result, searchInput.value);
  }
  
  // Filtre date
  applyDateFilter(result);
}

/**
 * Applique le filtre par date
 */
function applyDateFilter(entries = currentEntries) {
  const dateStart = document.getElementById('date-start');
  const dateEnd = document.getElementById('date-end');
  
  if (dateStart || dateEnd) {
    filteredEntries = Utils.filterByDate(
      entries,
      dateStart ? dateStart.value : null,
      dateEnd ? dateEnd.value : null
    );
  } else {
    filteredEntries = entries;
  }
}

/**
 * Met à jour les totaux
 */
function updateTotals() {
  const balance = Utils.checkBalance(filteredEntries);
  
  const totalDebitEl = document.getElementById('total-debit');
  const totalCreditEl = document.getElementById('total-credit');
  const balanceStatusEl = document.getElementById('balance-status');
  const entryCountEl = document.getElementById('entry-count');
  
  if (totalDebitEl) {
    totalDebitEl.textContent = Utils.formatCurrency(balance.totalDebit);
  }
  
  if (totalCreditEl) {
    totalCreditEl.textContent = Utils.formatCurrency(balance.totalCredit);
  }
  
  if (balanceStatusEl) {
    if (balance.balanced) {
      balanceStatusEl.innerHTML = '<span class="text-success">✓ Journal équilibré</span>';
    } else {
      balanceStatusEl.innerHTML = `<span class="text-danger">✗ Déséquilibre: ${Utils.formatCurrency(balance.difference)}</span>`;
    }
  }
  
  if (entryCountEl) {
    entryCountEl.textContent = filteredEntries.length;
  }
}

// Initialise la page quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('journal.html')) {
    initJournal();
  }
});
