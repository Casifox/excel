/**
 * ============================================
 * GRAND-LIVRE.JS - Grand Livre comptable
 * ============================================
 * Affiche toutes les écritures regroupées par compte
 */

/**
 * Initialise la page du Grand Livre
 */
function initGrandLivre() {
  console.log('Initialisation du Grand Livre...');
  
  // Génère le grand livre
  const grandLivreData = generateGrandLivre();
  
  // Affiche le contenu
  renderGrandLivre(grandLivreData);
  
  // Configure les exportations
  setupExportButtons();
}

/**
 * Génère le Grand Livre à partir des écritures
 * @returns {Object} - Les données du Grand Livre groupées par compte
 */
function generateGrandLivre() {
  // Groupe par compte
  const grouped = Utils.groupByAccount(AppData.entries);
  
  // Trie par numéro de compte
  const sortedAccounts = Object.keys(grouped).sort();
  
  const result = {};
  
  sortedAccounts.forEach(account => {
    const accountData = grouped[account];
    
    // Trie les écritures par date
    const sortedEntries = Utils.sortByDate(accountData.entries);
    
    result[account] = {
      account: account,
      name: getAccountName(account),
      entries: sortedEntries,
      totalDebit: accountData.debit,
      totalCredit: accountData.credit,
      solde: accountData.debit - accountData.credit
    };
  });
  
  return result;
}

/**
 * Récupère le nom d'un compte à partir de son numéro
 * @param {string} account - Le numéro de compte
 * @returns {string} - Le nom du compte
 */
function getAccountName(account) {
  const accountNames = {
    '101000': 'Capital social',
    '401000': 'Fournisseurs',
    '411000': 'Clients',
    '421000': 'Personnel - Rémunérations dues',
    '431000': 'Sécurité sociale',
    '445660': 'TVA déductible',
    '445710': 'TVA collectée',
    '512000': 'Banque',
    '604000': 'Achats de marchandises',
    '613000': 'Locations immobilières',
    '622000': 'Honoraires',
    '641000': 'Rémunérations du personnel',
    '707000': 'Ventes de marchandises'
  };
  
  return accountNames[account] || 'Compte ' + account;
}

/**
 * Affiche le Grand Livre
 * @param {Object} grandLivreData - Les données du Grand Livre
 */
function renderGrandLivre(grandLivreData) {
  const container = document.getElementById('grand-livre-container');
  if (!container) return;
  
  let html = '';
  
  const accounts = Object.keys(grandLivreData);
  
  if (accounts.length === 0) {
    html = `
      <div class="card">
        <p style="color: #7f8c8d; font-size: 1.1rem; text-align: center; padding: 40px;">
          Aucune donnée dans le Grand Livre
        </p>
        <p style="color: #95a5a6; text-align: center;">
          Ajoutez des écritures dans le journal
        </p>
      </div>
    `;
  } else {
    accounts.forEach(account => {
      const accountData = grandLivreData[account];
      const soldeClass = accountData.solde >= 0 ? 'balance-positive' : 'balance-negative';
      const soldeSign = accountData.solde >= 0 ? '' : '-';
      
      html += `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              Compte ${account} - ${accountData.name}
            </h3>
            <span class="${soldeClass}">
              Solde: ${soldeSign}${Utils.formatCurrency(Math.abs(accountData.solde))}
            </span>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Journal</th>
                  <th>Libellé</th>
                  <th class="text-right">Débit</th>
                  <th class="text-right">Crédit</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      let cumulativeBalance = 0;
      
      accountData.entries.forEach(entry => {
        cumulativeBalance += entry.debit - entry.credit;
        
        html += `
          <tr>
            <td>${Utils.formatDate(entry.date)}</td>
            <td>${entry.journal}</td>
            <td>${entry.label}</td>
            <td class="text-right">${entry.debit > 0 ? Utils.formatCurrency(entry.debit) : '-'}</td>
            <td class="text-right">${entry.credit > 0 ? Utils.formatCurrency(entry.credit) : '-'}</td>
          </tr>
        `;
      });
      
      // Totaux du compte
      html += `
        <tr class="total-row">
          <td colspan="3" class="text-center"><strong>Totaux</strong></td>
          <td class="text-right"><strong>${Utils.formatCurrency(accountData.totalDebit)}</strong></td>
          <td class="text-right"><strong>${Utils.formatCurrency(accountData.totalCredit)}</strong></td>
        </tr>
      `;
      
      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    });
  }
  
  container.innerHTML = html;
}

/**
 * Configure les boutons d'exportation
 */
function setupExportButtons() {
  const btnExportCSV = document.getElementById('btn-export-csv');
  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', () => {
      const grandLivreData = generateGrandLivre();
      
      let csvContent = 'Compte;Nom;Date;Journal;Libellé;Débit;Crédit\n';
      
      Object.values(grandLivreData).forEach(accountData => {
        accountData.entries.forEach(entry => {
          csvContent += `${accountData.account};${accountData.name};${entry.date};${entry.journal};"${entry.label.replace(/"/g, '""')}";${entry.debit.toFixed(2).replace('.', ',')};${entry.credit.toFixed(2).replace('.', ',')}\n`;
        });
      });
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'grand_livre_compta.csv';
      link.click();
      URL.revokeObjectURL(url);
    });
  }
}

// Initialise la page quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('grand-livre.html')) {
    initGrandLivre();
  }
});
