/**
 * ============================================
 * JOURNAL.JS - GESTION DU JOURNAL COMPTABLE
 * ============================================
 * Gestion complète du tableau des écritures comptables
 */

// Variables globales
let journalEntries = [];
let filteredEntries = [];

/**
 * Initialise la page Journal au chargement
 */
document.addEventListener('DOMContentLoaded', function() {
    // Charger les données
    loadJournalData();
    
    // Initialiser les écouteurs d'événements
    initEventListeners();
    
    // Afficher le tableau
    renderJournal();
});

/**
 * Charge les données depuis le localStorage
 */
function loadJournalData() {
    journalEntries = Storage.loadData();
    filteredEntries = [...journalEntries];
}

/**
 * Sauvegarde les données dans le localStorage
 */
function saveJournalData() {
    Storage.saveData(journalEntries);
    updateBalanceAlert();
}

/**
 * Initialise tous les écouteurs d'événements
 */
function initEventListeners() {
    // Bouton ajouter ligne
    document.getElementById('btn-add-row')?.addEventListener('click', addNewRow);
    
    // Export CSV
    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
        Utils.exportToCSV(journalEntries, 'journal_comptable.csv');
    });
    
    // Import JSON
    document.getElementById('import-json')?.addEventListener('change', handleImportJSON);
    
    // Recherche
    document.getElementById('search-input')?.addEventListener('input', applyFilters);
    
    // Filtres date
    document.getElementById('date-from')?.addEventListener('change', applyFilters);
    document.getElementById('date-to')?.addEventListener('change', applyFilters);
    
    // Filtre journal
    document.getElementById('journal-filter')?.addEventListener('change', applyFilters);
    
    // Bouton effacer filtres
    document.getElementById('btn-clear-filters')?.addEventListener('click', clearFilters);
}

/**
 * Applique les filtres de recherche
 */
function applyFilters() {
    const searchInput = document.getElementById('search-input')?.value || '';
    const dateFrom = document.getElementById('date-from')?.value || '';
    const dateTo = document.getElementById('date-to')?.value || '';
    const journalFilter = document.getElementById('journal-filter')?.value || '';
    
    const filters = {
        search: searchInput,
        dateFrom: dateFrom,
        dateTo: dateTo,
        journal: journalFilter
    };
    
    filteredEntries = filterEntries(journalEntries, filters);
    renderJournal();
}

/**
 * Efface tous les filtres
 */
function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    document.getElementById('journal-filter').value = '';
    filteredEntries = [...journalEntries];
    renderJournal();
}

/**
 * Ajoute une nouvelle ligne vide au journal
 */
function addNewRow() {
    const today = new Date();
    const formattedDate = Utils.formatDate(today.toISOString());
    
    const newRow = {
        id: Utils.generateId(),
        date: formattedDate,
        journal: 'ACH',
        account: '',
        label: '',
        debit: 0,
        credit: 0
    };
    
    journalEntries.push(newRow);
    filteredEntries = [...journalEntries];
    saveJournalData();
    renderJournal();
    
    // Scroll vers le bas
    const tableBody = document.getElementById('journal-tbody');
    tableBody.scrollTop = tableBody.scrollHeight;
}

/**
 * Supprime une ligne du journal
 * @param {string} id - ID de l'entrée à supprimer
 */
function deleteEntry(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette écriture ?')) {
        journalEntries = journalEntries.filter(entry => entry.id !== id);
        filteredEntries = [...journalEntries];
        saveJournalData();
        renderJournal();
    }
}

/**
 * Met à jour une entrée du journal
 * @param {string} id - ID de l'entrée
 * @param {string} field - Champ à modifier
 * @param {any} value - Nouvelle valeur
 */
function updateEntry(id, field, value) {
    const entry = journalEntries.find(e => e.id === id);
    if (entry) {
        if (field === 'debit' || field === 'credit') {
            // Nettoyer et convertir la valeur numérique
            const cleanValue = value.replace(/[^0-9.,]/g, '').replace(',', '.');
            entry[field] = parseFloat(cleanValue) || 0;
        } else {
            entry[field] = value;
        }
        saveJournalData();
        renderJournal(false); // Ne pas recharger complètement pour garder le focus
    }
}

/**
 * Affiche le journal dans le tableau HTML
 * @param {boolean} fullRender - Si true, rendu complet, sinon partiel
 */
function renderJournal(fullRender = true) {
    const tbody = document.getElementById('journal-tbody');
    const tfoot = document.getElementById('journal-tfoot');
    const emptyMessage = document.getElementById('empty-message');
    const tableContainer = document.querySelector('.journal-table-container');
    
    if (!tbody) return;
    
    // Gérer l'affichage du message "vide"
    if (journalEntries.length === 0) {
        emptyMessage?.classList.remove('hidden');
        tableContainer?.classList.add('hidden');
    } else {
        emptyMessage?.classList.add('hidden');
        tableContainer?.classList.remove('hidden');
    }
    
    // Rendu complet ou partiel
    if (fullRender) {
        tbody.innerHTML = filteredEntries.map(entry => createRowHTML(entry)).join('');
        
        // Ajouter les écouteurs pour l'édition inline
        addInlineEditListeners();
    }
    
    // Calculer et afficher les totaux
    renderTotals();
    
    // Mettre à jour l'alerte d'équilibre
    updateBalanceAlert();
}

/**
 * Crée le HTML pour une ligne du journal
 * @param {Object} entry - Entrée comptable
 * @returns {string} - HTML de la ligne
 */
function createRowHTML(entry) {
    return `
        <tr data-id="${entry.id}">
            <td class="editable-cell" data-field="date">${entry.date}</td>
            <td class="editable-cell" data-field="journal">${entry.journal}</td>
            <td class="editable-cell" data-field="account">${entry.account}</td>
            <td class="editable-cell" data-field="label">${entry.label}</td>
            <td class="editable-cell amount-cell" data-field="debit">${Utils.formatCurrency(entry.debit)}</td>
            <td class="editable-cell amount-cell" data-field="credit">${Utils.formatCurrency(entry.credit)}</td>
            <td>
                <button class="btn btn-danger btn-small btn-delete" title="Supprimer">🗑️</button>
            </td>
        </tr>
    `;
}

/**
 * Ajoute les écouteurs pour l'édition inline des cellules
 */
function addInlineEditListeners() {
    const editableCells = document.querySelectorAll('.editable-cell');
    
    editableCells.forEach(cell => {
        cell.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = row.dataset.id;
            const field = this.dataset.field;
            const currentValue = this.textContent.trim();
            
            // Créer un input pour l'édition
            let input;
            if (field === 'date') {
                input = document.createElement('input');
                input.type = 'date';
                // Convertir JJ/MM/AAAA en YYYY-MM-DD
                const parts = currentValue.split('/');
                if (parts.length === 3) {
                    input.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            } else if (field === 'journal') {
                input = document.createElement('select');
                input.innerHTML = `
                    <option value="ACH" ${currentValue === 'ACH' ? 'selected' : ''}>ACH</option>
                    <option value="VEN" ${currentValue === 'VEN' ? 'selected' : ''}>VEN</option>
                    <option value="BAN" ${currentValue === 'BAN' ? 'selected' : ''}>BAN</option>
                    <option value="CAI" ${currentValue === 'CAI' ? 'selected' : ''}>CAI</option>
                `;
            } else if (field === 'debit' || field === 'credit') {
                input = document.createElement('input');
                input.type = 'number';
                input.step = '0.01';
                input.min = '0';
                input.value = parseFloat(currentValue.replace(/[^0-9.]/g, '')) || 0;
                input.style.textAlign = 'right';
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.value = currentValue;
            }
            
            // Remplacer le contenu par l'input
            this.innerHTML = '';
            this.appendChild(input);
            input.focus();
            
            // Sélectionner tout le texte pour les inputs text
            if (input.type === 'text') {
                input.select();
            }
            
            // Sauvegarder lors de la perte de focus
            input.addEventListener('blur', function() {
                updateEntry(id, field, this.value);
            });
            
            // Sauvegarder avec Entrée
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    this.blur();
                }
            });
            
            // Annuler avec Échap
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    renderJournal();
                }
            });
        });
    });
    
    // Boutons de suppression
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = row.dataset.id;
            deleteEntry(id);
        });
    });
}

/**
 * Affiche les totaux dans le footer du tableau
 */
function renderTotals() {
    const tfoot = document.getElementById('journal-tfoot');
    if (!tfoot) return;
    
    const totalDebit = Utils.calculateTotalDebit(filteredEntries);
    const totalCredit = Utils.calculateTotalCredit(filteredEntries);
    const difference = totalDebit - totalCredit;
    
    const diffClass = Math.abs(difference) < 0.01 ? 'positive' : 'negative';
    const diffText = difference >= 0 ? '+' : '-';
    
    tfoot.innerHTML = `
        <tr class="balance-row">
            <td colspan="4" class="text-right"><strong>TOTAUX</strong></td>
            <td class="amount-cell"><strong>${Utils.formatCurrency(totalDebit)}</strong></td>
            <td class="amount-cell"><strong>${Utils.formatCurrency(totalCredit)}</strong></td>
            <td></td>
        </tr>
        <tr class="${Math.abs(difference) < 0.01 ? '' : 'negative'}">
            <td colspan="4" class="text-right">Écart:</td>
            <td colspan="2" class="amount-cell ${diffClass}"><strong>${diffText}${Utils.formatCurrency(Math.abs(difference))}</strong></td>
            <td></td>
        </tr>
    `;
}

/**
 * Met à jour l'alerte d'équilibre du journal
 */
function updateBalanceAlert() {
    const alertDiv = document.getElementById('balance-alert');
    if (!alertDiv) return;
    
    const totalDebit = Utils.calculateTotalDebit(journalEntries);
    const totalCredit = Utils.calculateTotalCredit(journalEntries);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
    
    if (journalEntries.length === 0) {
        alertDiv.classList.add('hidden');
        return;
    }
    
    alertDiv.classList.remove('hidden');
    
    if (isBalanced) {
        alertDiv.className = 'alert alert-success';
        alertDiv.innerHTML = '✅ <strong>Journal équilibré !</strong> Débit = Crédit = ' + Utils.formatCurrency(totalDebit);
    } else {
        const difference = Math.abs(totalDebit - totalCredit);
        alertDiv.className = 'alert alert-error';
        alertDiv.innerHTML = '❌ <strong>Journal déséquilibré !</strong> Écart de ' + Utils.formatCurrency(difference);
    }
}

/**
 * Gère l'import d'un fichier JSON
 * @param {Event} event - Événement change
 */
async function handleImportJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const importedData = await Utils.importFromJSON(file);
        
        if (confirm(`Importer ${importedData.length} écritures ?\n\nCela va AJOUTER les données importées aux données existantes.`)) {
            // Ajouter les IDs manquants
            const dataWithIds = importedData.map(entry => ({
                ...entry,
                id: entry.id || Utils.generateId()
            }));
            
            journalEntries = [...journalEntries, ...dataWithIds];
            filteredEntries = [...journalEntries];
            saveJournalData();
            renderJournal();
            
            Utils.showNotification(`${importedData.length} écritures importées avec succès !`, 'success');
        }
    } catch (error) {
        alert('Erreur lors de l\'import: ' + error.message);
        Utils.showNotification('Erreur lors de l\'import', 'error');
    }
    
    // Reset l'input file
    event.target.value = '';
}
