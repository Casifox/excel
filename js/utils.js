/**
 * ============================================
 * UTILS.JS - FONCTIONS UTILITAIRES
 * ============================================
 * Fonctions réutilisables pour toute l'application
 */

const Utils = {
    /**
     * Formate un nombre en format monétaire européen
     * @param {number} value - Valeur à formater
     * @returns {string} - Valeur formatée (ex: "1 234,56 €")
     */
    formatCurrency: function(value) {
        const num = parseFloat(value) || 0;
        return num.toLocaleString('fr-FR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        }) + ' €';
    },

    /**
     * Formate une date au format français (JJ/MM/AAAA)
     * @param {string|Date} dateStr - Date à formater
     * @returns {string} - Date formatée
     */
    formatDate: function(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    },

    /**
     * Parse une date depuis le format français vers Date
     * @param {string} dateStr - Date au format JJ/MM/AAAA
     * @returns {Date} - Objet Date
     */
    parseDate: function(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        return new Date(parts[2], parts[1] - 1, parts[0]);
    },

    /**
     * Génère un ID unique
     * @returns {string} - ID unique
     */
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Calcule le total débit d'un tableau d'écritures
     * @param {Array} entries - Tableau des écritures
     * @returns {number} - Total débit
     */
    calculateTotalDebit: function(entries) {
        return entries.reduce((total, entry) => {
            return total + (parseFloat(entry.debit) || 0);
        }, 0);
    },

    /**
     * Calcule le total crédit d'un tableau d'écritures
     * @param {Array} entries - Tableau des écritures
     * @returns {number} - Total crédit
     */
    calculateTotalCredit: function(entries) {
        return entries.reduce((total, entry) => {
            return total + (parseFloat(entry.credit) || 0);
        }, 0);
    },

    /**
     * Vérifie si le journal est équilibré (Débit = Crédit)
     * @param {Array} entries - Tableau des écritures
     * @returns {boolean}
     */
    isBalanced: function(entries) {
        const debit = this.calculateTotalDebit(entries);
        const credit = this.calculateTotalCredit(entries);
        return Math.abs(debit - credit) < 0.01;
    },

    /**
     * Obtient la différence entre débit et crédit
     * @param {Array} entries - Tableau des écritures
     * @returns {number} - Différence
     */
    getDifference: function(entries) {
        return this.calculateTotalDebit(entries) - this.calculateTotalCredit(entries);
    },

    /**
     * Classe les comptes par type (Actif, Passif, Charge, Produit)
     * @param {string} accountCode - Code du compte
     * @returns {string} - Type de compte
     */
    getAccountType: function(accountCode) {
        const code = parseInt(accountCode.toString().substring(0, 1));
        switch (code) {
            case 1: return 'Actif';
            case 2: return 'Actif';
            case 3: return 'Actif';
            case 4: return 'Passif';
            case 5: return 'Actif';
            case 6: return 'Charge';
            case 7: return 'Produit';
            default: return 'Autre';
        }
    },

    /**
     * Exporte des données en CSV
     * @param {Array} data - Données à exporter
     * @param {string} filename - Nom du fichier
     */
    exportToCSV: function(data, filename) {
        if (!data || data.length === 0) {
            alert('Aucune donnée à exporter');
            return;
        }

        const headers = ['Date', 'Journal', 'Compte', 'Libellé', 'Débit', 'Crédit'];
        const csvContent = [
            headers.join(';'),
            ...data.map(entry => 
                [entry.date, entry.journal, entry.account, entry.label, entry.debit, entry.credit].join(';')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    },

    /**
     * Importe des données depuis un fichier JSON
     * @param {File} file - Fichier JSON
     * @returns {Promise<Array>} - Données importées
     */
    importFromJSON: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (Array.isArray(data)) {
                        resolve(data);
                    } else {
                        reject(new Error('Format JSON invalide'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    },

    /**
     * Affiche une notification
     * @param {string} message - Message à afficher
     * @param {string} type - Type (success, error, warning)
     */
    showNotification: function(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type}`;
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.style.minWidth = '300px';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
