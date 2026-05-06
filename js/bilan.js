/**
 * ============================================
 * BILAN.JS - Bilan comptable
 * ============================================
 * Affiche le bilan (Actif / Passif)
 */

/**
 * Initialise la page du Bilan
 */
function initBilan() {
  console.log('Initialisation du Bilan...');
  
  // Génère les données du bilan
  const bilanData = generateBilan();
  
  // Affiche le contenu
  renderBilan(bilanData);
}

/**
 * Génère les données du bilan
 * @returns {Object} - Les données du bilan (Actif / Passif)
 */
function generateBilan() {
  // Groupe par compte
  const grouped = Utils.groupByAccount(AppData.entries);
  
  const actif = [];
  const passif = [];
  
  // Parcourt tous les comptes
  Object.values(grouped).forEach(accountData => {
    const account = accountData.account;
    const firstDigit = account.charAt(0);
    const debit = accountData.debit;
    const credit = accountData.credit;
    const solde = debit - credit;
    
    // Comptes d'actif (classes 2, 3, 4 débiteur, 5)
    if (['2', '3', '5'].includes(firstDigit)) {
      if (solde !== 0) {
        actif.push({
          account: account,
          name: getAccountName(account),
          amount: Math.abs(solde),
          nature: 'Actif'
        });
      }
    }
    // Comptes de passif (classes 1, 4 créditeur)
    else if (firstDigit === '1') {
      if (solde !== 0) {
        passif.push({
          account: account,
          name: getAccountName(account),
          amount: Math.abs(solde),
          nature: 'Passif'
        });
      }
    }
    // Comptes de tiers (classe 4) - peut être actif ou passif selon le solde
    else if (firstDigit === '4') {
      if (solde > 0) {
        // Solde débiteur = Actif (créances)
        actif.push({
          account: account,
          name: getAccountName(account),
          amount: solde,
          nature: 'Actif'
        });
      } else if (solde < 0) {
        // Solde créditeur = Passif (dettes)
        passif.push({
          account: account,
          name: getAccountName(account),
          amount: Math.abs(solde),
          nature: 'Passif'
        });
      }
    }
    // Comptes de résultat (classes 6 et 7) - à intégrer dans le résultat
    else if (['6', '7'].includes(firstDigit)) {
      // Sera traité séparément pour le résultat
    }
  });
  
  // Calcule le résultat (Produits - Charges)
  let resultat = 0;
  Object.values(grouped).forEach(accountData => {
    const firstDigit = accountData.account.charAt(0);
    if (firstDigit === '6') {
      resultat -= accountData.debit; // Charges
    } else if (firstDigit === '7') {
      resultat += accountData.credit; // Produits
    }
  });
  
  // Ajoute le résultat au passif (bénéfice) ou à l'actif (perte)
  if (resultat >= 0) {
    passif.push({
      account: '120000',
      name: 'Résultat de l\'exercice (Bénéfice)',
      amount: resultat,
      nature: 'Passif'
    });
  } else {
    actif.push({
      account: '129000',
      name: 'Résultat de l\'exercice (Perte)',
      amount: Math.abs(resultat),
      nature: 'Actif'
    });
  }
  
  // Trie par numéro de compte
  actif.sort((a, b) => a.account.localeCompare(b.account));
  passif.sort((a, b) => a.account.localeCompare(b.account));
  
  // Calcule les totaux
  const totalActif = actif.reduce((sum, item) => sum + item.amount, 0);
  const totalPassif = passif.reduce((sum, item) => sum + item.amount, 0);
  
  return {
    actif,
    passif,
    totalActif,
    totalPassif,
    equilibre: Math.abs(totalActif - totalPassif) < 0.01
  };
}

/**
 * Récupère le nom d'un compte à partir de son numéro
 * @param {string} account - Le numéro de compte
 * @returns {string} - Le nom du compte
 */
function getAccountName(account) {
  const accountNames = {
    '101000': 'Capital social',
    '120000': 'Résultat (Bénéfice)',
    '129000': 'Résultat (Perte)',
    '401000': 'Fournisseurs',
    '411000': 'Clients',
    '421000': 'Personnel - Rémunérations dues',
    '431000': 'Sécurité sociale',
    '445660': 'TVA déductible',
    '445710': 'TVA collectée',
    '512000': 'Banque'
  };
  
  return accountNames[account] || 'Compte ' + account;
}

/**
 * Affiche le bilan
 * @param {Object} bilanData - Les données du bilan
 */
function renderBilan(bilanData) {
  // Affiche l'actif
  renderActif(bilanData.actif, bilanData.totalActif);
  
  // Affiche le passif
  renderPassif(bilanData.passif, bilanData.totalPassif);
  
  // Affiche l'équilibre
  renderEquilibre(bilanData.equilibre, bilanData.totalActif, bilanData.totalPassif);
}

/**
 * Affiche la section Actif
 */
function renderActif(actif, totalActif) {
  const tbody = document.getElementById('actif-table-body');
  if (!tbody) return;
  
  let html = '';
  
  // Immobilisations (classe 2)
  const immobilisations = actif.filter(item => item.account.charAt(0) === '2');
  if (immobilisations.length > 0) {
    html += `
      <tr class="total-row">
        <td colspan="2"><strong>IMMOBILISATIONS</strong></td>
        <td class="text-right"></td>
      </tr>
    `;
    immobilisations.forEach(item => {
      html += `
        <tr>
          <td>${item.account}</td>
          <td>${item.name}</td>
          <td class="text-right">${Utils.formatCurrency(item.amount)}</td>
        </tr>
      `;
    });
  }
  
  // Stocks (classe 3)
  const stocks = actif.filter(item => item.account.charAt(0) === '3');
  if (stocks.length > 0) {
    html += `
      <tr class="total-row">
        <td colspan="2"><strong>STOCKS</strong></td>
        <td class="text-right"></td>
      </tr>
    `;
    stocks.forEach(item => {
      html += `
        <tr>
          <td>${item.account}</td>
          <td>${item.name}</td>
          <td class="text-right">${Utils.formatCurrency(item.amount)}</td>
        </tr>
      `;
    });
  }
  
  // Créances (classe 4 débiteur et partie de 5)
  const creances = actif.filter(item => ['4', '5'].includes(item.account.charAt(0)));
  if (creances.length > 0) {
    html += `
      <tr class="total-row">
        <td colspan="2"><strong>CRÉANCES & TRÉSORERIE</strong></td>
        <td class="text-right"></td>
      </tr>
    `;
    creances.forEach(item => {
      html += `
        <tr>
          <td>${item.account}</td>
          <td>${item.name}</td>
          <td class="text-right">${Utils.formatCurrency(item.amount)}</td>
        </tr>
      `;
    });
  }
  
  // Résultat (perte)
  const perte = actif.filter(item => item.account === '129000');
  if (perte.length > 0) {
    html += `
      <tr class="total-row">
        <td colspan="2"><strong>RÉSULTAT</strong></td>
        <td class="text-right"></td>
      </tr>
    `;
    perte.forEach(item => {
      html += `
        <tr>
          <td>${item.account}</td>
          <td>${item.name}</td>
          <td class="text-right text-danger">${Utils.formatCurrency(item.amount)}</td>
        </tr>
      `;
    });
  }
  
  // Total Actif
  html += `
    <tr class="total-row">
      <td colspan="2" class="text-center"><strong>TOTAL ACTIF</strong></td>
      <td class="text-right"><strong>${Utils.formatCurrency(totalActif)}</strong></td>
    </tr>
  `;
  
  tbody.innerHTML = html;
  
  if (actif.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center" style="padding: 20px;">
          <p style="color: #7f8c8d;">Aucun élément à l'actif</p>
        </td>
      </tr>
    `;
  }
}

/**
 * Affiche la section Passif
 */
function renderPassif(passif, totalPassif) {
  const tbody = document.getElementById('passif-table-body');
  if (!tbody) return;
  
  let html = '';
  
  // Capitaux propres (classe 1)
  const capitaux = passif.filter(item => item.account.charAt(0) === '1');
  if (capitaux.length > 0) {
    html += `
      <tr class="total-row">
        <td colspan="2"><strong>CAPITAUX PROPRES</strong></td>
        <td class="text-right"></td>
      </tr>
    `;
    capitaux.forEach(item => {
      const isResultat = item.account.startsWith('12');
      html += `
        <tr>
          <td>${item.account}</td>
          <td>${item.name}</td>
          <td class="text-right ${isResultat ? 'text-success' : ''}">${Utils.formatCurrency(item.amount)}</td>
        </tr>
      `;
    });
  }
  
  // Dettes (classe 4 créditeur)
  const dettes = passif.filter(item => item.account.charAt(0) === '4');
  if (dettes.length > 0) {
    html += `
      <tr class="total-row">
        <td colspan="2"><strong>DETTES</strong></td>
        <td class="text-right"></td>
      </tr>
    `;
    dettes.forEach(item => {
      html += `
        <tr>
          <td>${item.account}</td>
          <td>${item.name}</td>
          <td class="text-right">${Utils.formatCurrency(item.amount)}</td>
        </tr>
      `;
    });
  }
  
  // Total Passif
  html += `
    <tr class="total-row">
      <td colspan="2" class="text-center"><strong>TOTAL PASSIF</strong></td>
      <td class="text-right"><strong>${Utils.formatCurrency(totalPassif)}</strong></td>
    </tr>
  `;
  
  tbody.innerHTML = html;
  
  if (passif.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center" style="padding: 20px;">
          <p style="color: #7f8c8d;">Aucun élément au passif</p>
        </td>
      </tr>
    `;
  }
}

/**
 * Affiche l'équilibre du bilan
 */
function renderEquilibre(equilibre, totalActif, totalPassif) {
  const equilibreEl = document.getElementById('bilan-equilibre');
  
  if (equilibreEl) {
    if (equilibre) {
      equilibreEl.innerHTML = `
        <span class="text-success" style="font-size: 1.2rem;">
          ✓ Bilan équilibré : ${Utils.formatCurrency(totalActif)} = ${Utils.formatCurrency(totalPassif)}
        </span>
      `;
    } else {
      const difference = Math.abs(totalActif - totalPassif);
      equilibreEl.innerHTML = `
        <span class="text-danger" style="font-size: 1.2rem;">
          ✗ Bilan déséquilibré : Différence de ${Utils.formatCurrency(difference)}
        </span>
      `;
    }
  }
}

// Initialise la page quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('bilan.html')) {
    initBilan();
  }
});
