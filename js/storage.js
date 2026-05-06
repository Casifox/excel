/**
 * ============================================
 * STORAGE.JS - Gestion du localStorage
 * ============================================
 * Module pour sauvegarder et charger les données comptables
 */

const Storage = {
  // Clé de stockage dans localStorage
  STORAGE_KEY: 'compta_data',

  /**
   * Sauvegarde les données dans localStorage
   * @param {Object} data - Les données à sauvegarder
   */
  saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('Données sauvegardées avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return false;
    }
  },

  /**
   * Charge les données depuis localStorage
   * @returns {Object|null} - Les données chargées ou null
   */
  loadData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        console.log('Données chargées avec succès');
        return JSON.parse(data);
      }
      console.log('Aucune donnée trouvée');
      return null;
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      return null;
    }
  },

  /**
   * Réinitialise toutes les données
   * @returns {boolean} - True si réussi
   */
  resetData() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Données réinitialisées');
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
  hasData() {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  },

  /**
   * Exporte les données en fichier JSON
   */
  exportData() {
    const data = this.loadData();
    if (!data) {
      alert('Aucune donnée à exporter');
      return;
    }

    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `compta_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  },

  /**
   * Importe des données depuis un fichier JSON
   * @param {File} file - Le fichier à importer
   * @returns {Promise<Object>}
   */
  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (this.saveData(data)) {
            resolve(data);
          } else {
            reject(new Error('Erreur lors de la sauvegarde'));
          }
        } catch (error) {
          reject(new Error('Fichier JSON invalide'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Erreur de lecture du fichier'));
      };
      
      reader.readAsText(file);
    });
  }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
