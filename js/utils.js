/**
 * ============================================
 * UTILS.JS - Fonctions utilitaires
 * ============================================
 * Fonctions réutilisables pour l'ensemble de l'application
 */

const Utils = {
  /**
   * Formate un nombre en format monétaire
   * @param {number} amount - Le montant à formater
   * @returns {string} - Le montant formaté
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },

  /**
   * Formate une date
   * @param {string|Date} date - La date à formater
   * @returns {string} - La date formatée (JJ/MM/AAAA)
   */
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR');
  },

  /**
   * Génère un ID unique
   * @returns {string} - Un ID unique
   */
  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Parse un montant depuis une chaîne de caractères
   * @param {string} value - La valeur à parser
   * @returns {number} - Le montant parsé
   */
  parseAmount(value) {
    if (!value) return 0;
    // Supprime les espaces et remplace la virgule par un point
    const cleaned = value.toString().replace(/\s/g, '').replace(',', '.');
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : amount;
  },

  /**
   * Calcule le total d'un tableau d'écritures
   * @param {Array} entries - Les écritures comptables
   * @param {string} field - Le champ à sommer ('debit' ou 'credit')
   * @returns {number} - Le total
   */
  calculateTotal(entries, field) {
    return entries.reduce((total, entry) => {
      return total + (parseFloat(entry[field]) || 0);
    }, 0);
  },

  /**
   * Vérifie si le journal est équilibré
   * @param {Array} entries - Les écritures comptables
   * @returns {Object} - { balanced: boolean, difference: number }
   */
  checkBalance(entries) {
    const totalDebit = this.calculateTotal(entries, 'debit');
    const totalCredit = this.calculateTotal(entries, 'credit');
    const difference = Math.abs(totalDebit - totalCredit);
    
    return {
      balanced: difference < 0.01, // Tolérance de 1 centime
      difference: difference,
      totalDebit,
      totalCredit
    };
  },

  /**
   * Groupe les écritures par compte
   * @param {Array} entries - Les écritures comptables
   * @returns {Object} - Objet groupé par numéro de compte
   */
  groupByAccount(entries) {
    return entries.reduce((groups, entry) => {
      const account = entry.account;
      if (!groups[account]) {
        groups[account] = {
          account: account,
          debit: 0,
          credit: 0,
          entries: []
        };
      }
      groups[account].debit += parseFloat(entry.debit) || 0;
      groups[account].credit += parseFloat(entry.credit) || 0;
      groups[account].entries.push(entry);
      return groups;
    }, {});
  },

  /**
   * Trie les écritures par date
   * @param {Array} entries - Les écritures à trier
   * @returns {Array} - Les écritures triées
   */
  sortByDate(entries) {
    return [...entries].sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
  },

  /**
   * Filtre les écritures par date
   * @param {Array} entries - Les écritures à filtrer
   * @param {string} startDate - Date de début
   * @param {string} endDate - Date de fin
   * @returns {Array} - Les écritures filtrées
   */
  filterByDate(entries, startDate, endDate) {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-12-31');
      return entryDate >= start && entryDate <= end;
    });
  },

  /**
   * Recherche dans les écritures
   * @param {Array} entries - Les écritures à rechercher
   * @param {string} query - La recherche
   * @returns {Array} - Les écritures correspondantes
   */
  search(entries, query) {
    if (!query) return entries;
    const lowerQuery = query.toLowerCase();
    return entries.filter(entry => {
      return (
        entry.label.toLowerCase().includes(lowerQuery) ||
        entry.account.includes(lowerQuery) ||
        entry.journal.toLowerCase().includes(lowerQuery)
      );
    });
  },

  /**
   * Exporte les données en CSV
   * @param {Array} entries - Les écritures à exporter
   * @param {string} filename - Nom du fichier
   */
  exportToCSV(entries, filename = 'export_compta.csv') {
    if (!entries || entries.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    // En-têtes CSV
    const headers = ['Date', 'Journal', 'Compte', 'Libellé', 'Débit', 'Crédit'];
    
    // Lignes de données
    const rows = entries.map(entry => [
      entry.date,
      entry.journal,
      entry.account,
      `"${entry.label.replace(/"/g, '""')}"`,
      entry.debit.toFixed(2).replace('.', ','),
      entry.credit.toFixed(2).replace('.', ',')
    ]);

    // Création du contenu CSV
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    // Téléchargement
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Affiche un message d'alerte
   * @param {string} message - Le message à afficher
   * @param {string} type - Le type (success, error, warning)
   */
  showAlert(message, type = 'success') {
    // Crée l'élément d'alerte s'il n'existe pas
    let alertDiv = document.querySelector('.alert-notification');
    if (!alertDiv) {
      alertDiv = document.createElement('div');
      alertDiv.className = 'alert-notification';
      alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 4px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
      `;
      document.body.appendChild(alertDiv);
    }

    // Définit les couleurs selon le type
    const colors = {
      success: '#27ae60',
      error: '#e74c3c',
      warning: '#f39c12'
    };

    alertDiv.style.backgroundColor = colors[type] || colors.success;
    alertDiv.style.color = 'white';
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';

    // Masque après 3 secondes
    setTimeout(() => {
      alertDiv.style.display = 'none';
    }, 3000);
  },

  /**
   * Valide un numéro de compte comptable
   * @param {string} account - Le numéro de compte
   * @returns {boolean} - True si valide
   */
  isValidAccount(account) {
    // Compte entre 3 et 7 chiffres
    return /^\d{3,7}$/.test(account);
  },

  /**
   * Détermine la nature d'un compte (Actif, Passif, Charge, Produit)
   * @param {string} account - Le numéro de compte
   * @returns {string} - La nature du compte
   */
  getAccountNature(account) {
    const firstDigit = account.charAt(0);
    const natureMap = {
      '1': 'Actif/Passif (Bilan)',
      '2': 'Actif (Bilan)',
      '3': 'Actif (Bilan)',
      '4': 'Actif/Passif (Bilan)',
      '5': 'Actif (Bilan)',
      '6': 'Charge (Résultat)',
      '7': 'Produit (Résultat)'
    };
    return natureMap[firstDigit] || 'Inconnu';
  }
};

// Animation pour les alertes
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
