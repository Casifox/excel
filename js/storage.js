/**
 * ============================================
 * STORAGE.JS - GESTION DU LOCALSTORAGE
 * ============================================
 * Module pour sauvegarder et charger les données comptables
 */

const Storage = {
    // Clé de stockage dans localStorage
    STORAGE_KEY: 'comptaweb_data',

    /**
     * Sauvegarde les données dans localStorage
     * @param {Array} data - Tableau des écritures comptables
     */
    saveData: function(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            return false;
        }
    },

    /**
     * Charge les données depuis localStorage
     * @returns {Array} - Tableau des écritures comptables
     */
    loadData: function() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) {
                return [];
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            return [];
        }
    },

    /**
     * Réinitialise complètement les données (supprime tout)
     * @returns {boolean} - true si succès
     */
    resetData: function() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
            return false;
        }
    },

    /**
     * Vérifie si des données existent
     * @returns {boolean}
     */
    hasData: function() {
        const data = this.loadData();
        return data && data.length > 0;
    },

    /**
     * Obtient le nombre d'écritures
     * @returns {number}
     */
    getCount: function() {
        const data = this.loadData();
        return data ? data.length : 0;
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
