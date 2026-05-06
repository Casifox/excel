/**
 * ============================================
 * APP.JS - LOGIQUE GLOBALE DE L'APPLICATION
 * ============================================
 * Initialisation et gestion du reset double-clic
 */

// Variables globales pour le système de reset
let resetClickCount = 0;
let resetTimeout = null;

/**
 * Initialise l'application au chargement
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le bouton de réinitialisation sur toutes les pages
    initResetButton();
    
    // Mettre en surbrillance le lien actif dans la sidebar
    highlightActiveLink();
});

/**
 * Initialise le bouton de réinitialisation avec double-clic
 */
function initResetButton() {
    const resetBtn = document.getElementById('resetBtn');
    if (!resetBtn) return;

    resetBtn.addEventListener('click', handleResetClick);
}

/**
 * Gère le clic sur le bouton de réinitialisation (système double-clic)
 */
function handleResetClick(e) {
    e.preventDefault();
    
    resetClickCount++;
    
    // Premier clic : afficher l'avertissement
    if (resetClickCount === 1) {
        const btn = e.target;
        btn.classList.add('reset-warning');
        btn.textContent = '⚠️ Cliquez à nouveau pour confirmer';
        
        alert('⚠️ ATTENTION !\n\nCeci va supprimer TOUTES les données comptables.\n\nCliquez une seconde fois sur le bouton pour confirmer la suppression.');
        
        // Reset après 3 secondes si pas de deuxième clic
        resetTimeout = setTimeout(() => {
            resetClickCount = 0;
            btn.classList.remove('reset-warning');
            btn.textContent = '🗑️ Réinitialiser';
        }, 3000);
        
        return;
    }
    
    // Deuxième clic : confirmer et exécuter le reset
    if (resetClickCount >= 2) {
        clearTimeout(resetTimeout);
        
        const confirmed = confirm(
            '❗ CONFIRMATION DÉFINITIVE ❗\n\n' +
            'Êtes-vous ABSOLUMENT SÛR de vouloir tout supprimer ?\n\n' +
            '• Toutes les écritures seront effacées\n' +
            '• La balance sera remise à zéro\n' +
            '• Le grand livre sera vidé\n' +
            '• Le bilan et le résultat seront à zéro\n\n' +
            'Cette action est IRREVERSIBLE !\n\n' +
            'Cliquez sur OK pour confirmer ou ANNULER pour annuler.'
        );
        
        if (confirmed) {
            performFullReset();
        } else {
            // Annulation : reset du compteur
            resetClickCount = 0;
            e.target.classList.remove('reset-warning');
            e.target.textContent = '🗑️ Réinitialiser';
        }
    }
}

/**
 * Exécute la réinitialisation complète
 */
function performFullReset() {
    // Supprimer toutes les données du localStorage
    Storage.resetData();
    
    // Afficher un message de confirmation
    alert('✅ Toutes les données ont été supprimées avec succès.\n\nL\'application est maintenant vide.\n\nLa page va se recharger.');
    
    // Recharger la page pour appliquer le reset
    window.location.reload();
}

/**
 * Met en surbrillance le lien actif dans la navigation
 */
function highlightActiveLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Fonction utilitaire pour obtenir les données filtrées
 * @param {Array} entries - Tableau des écritures
 * @param {Object} filters - Filtres à appliquer
 * @returns {Array} - Écritures filtrées
 */
function filterEntries(entries, filters = {}) {
    let filtered = [...entries];
    
    // Filtre par recherche textuelle
    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(entry => 
            entry.label.toLowerCase().includes(searchTerm) ||
            entry.account.toString().includes(searchTerm) ||
            entry.journal.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filtre par date de début
    if (filters.dateFrom) {
        const fromDate = Utils.parseDate(filters.dateFrom);
        if (fromDate) {
            filtered = filtered.filter(entry => {
                const entryDate = Utils.parseDate(entry.date);
                return entryDate && entryDate >= fromDate;
            });
        }
    }
    
    // Filtre par date de fin
    if (filters.dateTo) {
        const toDate = Utils.parseDate(filters.dateTo);
        if (toDate) {
            filtered = filtered.filter(entry => {
                const entryDate = Utils.parseDate(entry.date);
                return entryDate && entryDate <= toDate;
            });
        }
    }
    
    // Filtre par journal
    if (filters.journal) {
        filtered = filtered.filter(entry => entry.journal === filters.journal);
    }
    
    return filtered;
}

// Rendre la fonction accessible globalement pour les tests
window.resetAllData = performFullReset;
