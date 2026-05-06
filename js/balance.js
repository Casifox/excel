/**
 * ============================================
 * BALANCE.JS - Balance comptable
 * ============================================
 * Affiche la balance par compte avec totaux et soldes
 */

/**
 * Initialise la page de la balance
 */
function initBalance() {
  console.log('Initialisation de la balance...');
  
  // Génère la balance
  const balanceData = generateBalance();
  
  // Affiche le tableau
  renderBalanceTable(balanceData);
  
  // Configure les exportations
  setupExportButtons();
}

/**
 * Génère la balance à partir des écritures
 * @returns {Array} - Les données de la balance
 */
function generateBalance() {
  // Groupe par compte
  const grouped = Utils.groupByAccount(AppData.entries);
  
  // Convertit en tableau et calcule les soldes
  const balanceData = Object.values(grouped).map(account => {
    const debit = account.debit;
    const credit = account.credit;
    const solde = debit - credit;
    
    return {
      account: account.account,
      name: getAccountName(account.account),
      debit: debit,
      credit: credit,
      solde: solde,
      nature: Utils.getAccountNature(account.account)
    };
  });
  
  // Trie par numéro de compte
  balanceData.sort((a, b) => a.account.localeCompare(b.account));
  
  return balanceData;
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
 * Affiche le tableau de la balance
 * @param {Array} balanceData - Les données de la balance
 */
function renderBalanceTable(balanceData) {
  const tbody = document.getElementById('balance-table-body');
  if (!tbody) return;
  
  let html = '';
  
  let totalDebit = 0;
  let totalCredit = 0;
  let totalSoldeDebiteur = 0;
  let totalSoldeCrediteur = 0;
  
  balanceData.forEach(item => {
    totalDebit += item.debit;
    totalCredit += item.credit;
    
    if (item.solde >= 0) {
      totalSoldeDebiteur += item.solde;
    } else {
      totalSoldeCrediteur += Math.abs(item.solde);
    }
    
    const soldeClass = item.solde >= 0 ? 'balance-positive' : 'balance-negative';
    const soldeSign = item.solde >= 0 ? '' : '-';
    
    html += `
      <tr>
        <td><strong>${item.account}</strong></td>
        <td>${item.name}</td>
        <td class="text-right">${item.debit > 0 ? Utils.formatCurrency(item.debit) : '-'}</td>
        <td class="text-right">${item.credit > 0 ? Utils.formatCurrency(item.credit) : '-'}</td>
        <td class="text-right ${soldeClass}">
          ${item.solde !== 0 ? soldeSign + Utils.formatCurrency(Math.abs(item.solde)) : '-'}
        </td>
      </tr>
    `;
  });
  
  // Ajoute les totaux
  html += `
    <tr class="total-row">
      <td colspan="2" class="text-center"><strong>TOTAUX</strong></td>
      <td class="text-right"><strong>${Utils.formatCurrency(totalDebit)}</strong></td>
      <td class="text-right"><strong>${Utils.formatCurrency(totalCredit)}</strong></td>
      <td class="text-right">
        <strong>
          ${Utils.formatCurrency(totalSoldeDebiteur)} / ${Utils.formatCurrency(totalSoldeCrediteur)}
        </strong>
      </td>
    </tr>
  `;
  
  tbody.innerHTML = html;
  
  // Si aucune donnée
  if (balanceData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center" style="padding: 40px;">
          <p style="color: #7f8c8d; font-size: 1.1rem;">Aucune donnée dans la balance</p>
          <p style="color: #95a5a6; margin-top: 10px;">Ajoutez des écritures dans le journal</p>
        </td>
      </tr>
    `;
  }
}

/**
 * Configure les boutons d'exportation
 */
function setupExportButtons() {
  const btnExportCSV = document.getElementById('btn-export-csv');
  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', () => {
      const balanceData = generateBalance();
      const csvRows = balanceData.map(item => [
        item.account,
        item.name,
        item.debit.toFixed(2).replace('.', ','),
        item.credit.toFixed(2).replace('.', ','),
        item.solde.toFixed(2).replace('.', ',')
      ]);
      
      const headers = ['Compte', 'Nom', 'Débit', 'Crédit', 'Solde'];
      const csvContent = [
        headers.join(';'),
        ...csvRows.map(row => row.join(';'))
      ].join('\n');
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'balance_compta.csv';
      link.click();
      URL.revokeObjectURL(url);
    });
  }
}

// Initialise la page quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('balance.html')) {
    initBalance();
  }
});
