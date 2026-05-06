/**
 * ============================================
 * APP.JS - Logique globale de l'application
 * ============================================
 * Initialisation et fonctions communes à toutes les pages
 */

// Données globales de l'application
let AppData = {
  entries: [], // Toutes les écritures comptables
  initialized: false
};

/**
 * Initialise l'application
 */
function initApp() {
  console.log('Initialisation de l\'application...');
  
  // Charge les données existantes ou initialise avec des données de test
  const storedData = Storage.loadData();
  
  if (storedData && storedData.entries) {
    AppData.entries = storedData.entries;
    console.log(`${AppData.entries.length} écritures chargées`);
  } else {
    // Première utilisation : ajoute des données de test
    initializeTestData();
  }
  
  AppData.initialized = true;
  
  // Met à jour la navigation active
  updateActiveNav();
  
  console.log('Application initialisée avec succès');
}

/**
 * Initialise les données de test (10 écritures)
 */
function initializeTestData() {
  console.log('Initialisation des données de test...');
  
  const today = new Date();
  const year = today.getFullYear();
  
  // Données de test réalistes
  AppData.entries = [
    {
      id: Utils.generateId(),
      date: `${year}-01-02`,
      journal: 'BAN',
      account: '512000',
      label: 'Apport en capital initial',
      debit: 10000,
      credit: 0
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-02`,
      journal: 'CAI',
      account: '101000',
      label: 'Capital social',
      debit: 0,
      credit: 10000
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-05`,
      journal: 'ACH',
      account: '604000',
      label: 'Achat de marchandises',
      debit: 1500,
      credit: 0
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-05`,
      journal: 'ACH',
      account: '445660',
      label: 'TVA déductible sur achats',
      debit: 300,
      credit: 0
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-05`,
      journal: 'ACH',
      account: '401000',
      label: 'Fournisseur - Facture F001',
      debit: 0,
      credit: 1800
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-10`,
      journal: 'VEN',
      account: '411000',
      label: 'Client - Facture V001',
      debit: 2400,
      credit: 0
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-10`,
      journal: 'VEN',
      account: '707000',
      label: 'Vente de marchandises',
      debit: 0,
      credit: 2000
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-10`,
      journal: 'VEN',
      account: '445710',
      label: 'TVA collectée',
      debit: 0,
      credit: 400
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-15`,
      journal: 'BAN',
      account: '401000',
      label: 'Paiement fournisseur F001',
      debit: 1800,
      credit: 0
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-15`,
      journal: 'BAN',
      account: '512000',
      label: 'Virement bancaire',
      debit: 0,
      credit: 1800
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-20`,
      journal: 'ACH',
      account: '613000',
      label: 'Loyer bureau janvier',
      debit: 800,
      credit: 0
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-20`,
      journal: 'ACH',
      account: '445660',
      label: 'TVA déductible loyer',
      debit: 160,
      credit: 0
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-20`,
      journal: 'ACH',
      account: '401000',
      label: 'Propriétaire - Loyer',
      debit: 0,
      credit: 960
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-25`,
      journal: 'BAN',
      account: '512000',
      label: 'Encaissement client V001',
      debit: 2400,
      credit: 0
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-25`,
      journal: 'BAN',
      account: '411000',
      label: 'Règlement client',
      debit: 0,
      credit: 2400
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-28`,
      journal: 'ACH',
      account: '641000',
      label: 'Salaire janvier',
      debit: 2000,
      credit: 0
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-28`,
      journal: 'ACH',
      account: '431000',
      label: 'Charges sociales',
      debit: 800,
      credit: 0
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-28`,
      journal: 'ACH',
      account: '421000',
      label: 'Personnel - Rémunération due',
      debit: 0,
      credit: 2800
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-31`,
      journal: 'ACH',
      account: '622000',
      label: 'Honoraires comptable',
      debit: 500,
      credit: 0
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-31`,
      journal: 'ACH',
      account: '445660',
      label: 'TVA déductible services',
      debit: 100,
      credit: 0
    },
    {
      id: Utils.generateId(),
      date: `${year}-01-31`,
      journal: 'ACH',
      account: '401000',
      label: 'Expert-comptable',
      debit: 0,
      credit: 600
    }
  ];
  
  // Sauvegarde les données
  saveAllData();
  console.log(`${AppData.entries.length} écritures de test créées`);
}

/**
 * Sauvegarde toutes les données
 */
function saveAllData() {
  Storage.saveData({ entries: AppData.entries });
}

/**
 * Ajoute une nouvelle écriture
 * @param {Object} entry - L'écriture à ajouter
 */
function addEntry(entry) {
  const newEntry = {
    id: Utils.generateId(),
    date: entry.date,
    journal: entry.journal,
    account: entry.account,
    label: entry.label,
    debit: parseFloat(entry.debit) || 0,
    credit: parseFloat(entry.credit) || 0
  };
  
  AppData.entries.push(newEntry);
  saveAllData();
  return newEntry;
}

/**
 * Supprime une écriture
 * @param {string} id - L'ID de l'écriture à supprimer
 */
function deleteEntry(id) {
  AppData.entries = AppData.entries.filter(e => e.id !== id);
  saveAllData();
}

/**
 * Met à jour une écriture
 * @param {string} id - L'ID de l'écriture à mettre à jour
 * @param {Object} updates - Les modifications à apporter
 */
function updateEntry(id, updates) {
  const index = AppData.entries.findIndex(e => e.id === id);
  if (index !== -1) {
    AppData.entries[index] = { ...AppData.entries[index], ...updates };
    saveAllData();
    return AppData.entries[index];
  }
  return null;
}

/**
 * Réinitialise toutes les données
 */
function resetAllData() {
  if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données ? Cette action est irréversible.')) {
    Storage.resetData();
    AppData.entries = [];
    location.reload();
  }
}

/**
 * Met à jour la navigation active
 */
function updateActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  
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
 * Génère le HTML de la sidebar
 * @returns {string} - Le HTML de la sidebar
 */
function generateSidebar() {
  return `
    <div class="sidebar">
      <div class="sidebar-header">
        <h1>📊 ComptaWeb</h1>
        <p>Gestion Comptable</p>
      </div>
      <ul class="nav-menu">
        <li class="nav-item">
          <a href="index.html" class="nav-link">
            📈 Dashboard
          </a>
        </li>
        <li class="nav-item">
          <a href="journal.html" class="nav-link">
            📝 Journal
          </a>
        </li>
        <li class="nav-item">
          <a href="balance.html" class="nav-link">
            ⚖️ Balance
          </a>
        </li>
        <li class="nav-item">
          <a href="grand-livre.html" class="nav-link">
            📚 Grand Livre
          </a>
        </li>
        <li class="nav-item">
          <a href="resultat.html" class="nav-link">
            📉 Résultat
          </a>
        </li>
        <li class="nav-item">
          <a href="bilan.html" class="nav-link">
            🧾 Bilan
          </a>
        </li>
      </ul>
    </div>
  `;
}

/**
 * Injecte la sidebar dans la page
 */
function injectSidebar() {
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = generateSidebar();
  }
}

/**
 * Attend que le DOM soit chargé
 */
document.addEventListener('DOMContentLoaded', function() {
  injectSidebar();
  initApp();
  
  // Rend les fonctions disponibles globalement
  window.AppData = AppData;
  window.addEntry = addEntry;
  window.deleteEntry = deleteEntry;
  window.updateEntry = updateEntry;
  window.saveAllData = saveAllData;
  window.resetAllData = resetAllData;
  window.Storage = Storage;
  window.Utils = Utils;
});
