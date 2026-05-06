/**
 * ============================================
 * RESULTAT.JS - Compte de Résultat
 * ============================================
 * Calcule et affiche le résultat (Produits - Charges)
 */

/**
 * Initialise la page du Compte de Résultat
 */
function initResultat() {
  console.log('Initialisation du Compte de Résultat...');
  
  // Génère les données du résultat
  const resultatData = generateResultat();
  
  // Affiche le contenu
  renderResultat(resultatData);
  
  // Dessine le graphique
  drawChart(resultatData);
}

/**
 * Génère les données du compte de résultat
 * @returns {Object} - Les données du résultat
 */
function generateResultat() {
  // Sépare charges (classe 6) et produits (classe 7)
  const charges = [];
  const produits = [];
  
  AppData.entries.forEach(entry => {
    const accountClass = entry.account.charAt(0);
    
    if (accountClass === '6') {
      charges.push(entry);
    } else if (accountClass === '7') {
      produits.push(entry);
    }
  });
  
  // Calcule les totaux par compte pour les charges
  const chargesByAccount = Utils.groupByAccount(charges);
  const chargesDetails = Object.values(chargesByAccount).map(acc => ({
    account: acc.account,
    name: getAccountName(acc.account),
    amount: acc.debit
  }));
  
  // Calcule les totaux par compte pour les produits
  const produitsByAccount = Utils.groupByAccount(produits);
  const produitsDetails = Object.values(produitsByAccount).map(acc => ({
    account: acc.account,
    name: getAccountName(acc.account),
    amount: acc.credit
  }));
  
  // Trie par numéro de compte
  chargesDetails.sort((a, b) => a.account.localeCompare(b.account));
  produitsDetails.sort((a, b) => a.account.localeCompare(b.account));
  
  // Calcule les totaux
  const totalCharges = chargesDetails.reduce((sum, item) => sum + item.amount, 0);
  const totalProduits = produitsDetails.reduce((sum, item) => sum + item.amount, 0);
  
  // Calcule le résultat
  const resultat = totalProduits - totalCharges;
  const isBenefice = resultat >= 0;
  
  return {
    charges: chargesDetails,
    produits: produitsDetails,
    totalCharges,
    totalProduits,
    resultat,
    isBenefice
  };
}

/**
 * Récupère le nom d'un compte à partir de son numéro
 * @param {string} account - Le numéro de compte
 * @returns {string} - Le nom du compte
 */
function getAccountName(account) {
  const accountNames = {
    '604000': 'Achats de marchandises',
    '613000': 'Locations immobilières',
    '622000': 'Honoraires',
    '641000': 'Rémunérations du personnel',
    '445660': 'TVA déductible (charges)',
    '431000': 'Charges sociales',
    '707000': 'Ventes de marchandises',
    '445710': 'TVA collectée (produits)'
  };
  
  return accountNames[account] || 'Compte ' + account;
}

/**
 * Affiche le compte de résultat
 * @param {Object} resultatData - Les données du résultat
 */
function renderResultat(resultatData) {
  // Affiche les charges
  renderCharges(resultatData.charges, resultatData.totalCharges);
  
  // Affiche les produits
  renderProduits(resultatData.produits, resultatData.totalProduits);
  
  // Affiche le résultat
  renderResultatFinal(resultatData.resultat, resultatData.isBenefice);
}

/**
 * Affiche la section des charges
 */
function renderCharges(charges, totalCharges) {
  const tbody = document.getElementById('charges-table-body');
  if (!tbody) return;
  
  let html = '';
  
  charges.forEach(item => {
    html += `
      <tr>
        <td><strong>${item.account}</strong></td>
        <td>${item.name}</td>
        <td class="text-right">${Utils.formatCurrency(item.amount)}</td>
      </tr>
    `;
  });
  
  // Total charges
  html += `
    <tr class="total-row">
      <td colspan="2" class="text-center"><strong>Total Charges</strong></td>
      <td class="text-right"><strong>${Utils.formatCurrency(totalCharges)}</strong></td>
    </tr>
  `;
  
  tbody.innerHTML = html;
  
  if (charges.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center" style="padding: 20px;">
          <p style="color: #7f8c8d;">Aucune charge enregistrée</p>
        </td>
      </tr>
    `;
  }
}

/**
 * Affiche la section des produits
 */
function renderProduits(produits, totalProduits) {
  const tbody = document.getElementById('produits-table-body');
  if (!tbody) return;
  
  let html = '';
  
  produits.forEach(item => {
    html += `
      <tr>
        <td><strong>${item.account}</strong></td>
        <td>${item.name}</td>
        <td class="text-right">${Utils.formatCurrency(item.amount)}</td>
      </tr>
    `;
  });
  
  // Total produits
  html += `
    <tr class="total-row">
      <td colspan="2" class="text-center"><strong>Total Produits</strong></td>
      <td class="text-right"><strong>${Utils.formatCurrency(totalProduits)}</strong></td>
    </tr>
  `;
  
  tbody.innerHTML = html;
  
  if (produits.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center" style="padding: 20px;">
          <p style="color: #7f8c8d;">Aucun produit enregistré</p>
        </td>
      </tr>
    `;
  }
}

/**
 * Affiche le résultat final
 */
function renderResultatFinal(resultat, isBenefice) {
  const resultatEl = document.getElementById('resultat-final');
  const resultatLabelEl = document.getElementById('resultat-label');
  
  if (resultatEl) {
    resultatEl.textContent = Utils.formatCurrency(Math.abs(resultat));
    resultatEl.className = isBenefice ? 'stat-value text-success' : 'stat-value text-danger';
  }
  
  if (resultatLabelEl) {
    resultatLabelEl.textContent = isBenefice ? 'BÉNÉFICE' : 'PERTE';
    resultatLabelEl.className = isBenefice ? 'stat-label text-success' : 'stat-label text-danger';
  }
}

/**
 * Dessine le graphique charges/produits
 */
function drawChart(resultatData) {
  const canvas = document.getElementById('resultat-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Dimensions
  const width = canvas.width;
  const height = canvas.height;
  const padding = 60;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  
  // Efface le canvas
  ctx.clearRect(0, 0, width, height);
  
  const totalCharges = resultatData.totalCharges;
  const totalProduits = resultatData.totalProduits;
  const maxVal = Math.max(totalCharges, totalProduits, 1);
  
  // Largeur des barres
  const barWidth = Math.min(100, chartWidth / 3);
  const gap = (chartWidth - 2 * barWidth) / 3;
  
  // Position X des barres
  const chargesX = padding + gap;
  const produitsX = chargesX + barWidth + gap;
  
  // Hauteur des barres
  const chargesHeight = (totalCharges / maxVal) * chartHeight;
  const produitsHeight = (totalProduits / maxVal) * chartHeight;
  
  // Dessine la barre des charges (rouge)
  const chargesY = padding + chartHeight - chargesHeight;
  
  // Gradient pour charges
  const chargesGradient = ctx.createLinearGradient(0, chargesY, 0, padding + chartHeight);
  chargesGradient.addColorStop(0, '#e74c3c');
  chargesGradient.addColorStop(1, '#c0392b');
  
  ctx.fillStyle = chargesGradient;
  ctx.fillRect(chargesX, chargesY, barWidth, chargesHeight);
  
  // Dessine la barre des produits (vert)
  const produitsY = padding + chartHeight - produitsHeight;
  
  // Gradient pour produits
  const produitsGradient = ctx.createLinearGradient(0, produitsY, 0, padding + chartHeight);
  produitsGradient.addColorStop(0, '#27ae60');
  produitsGradient.addColorStop(1, '#229954');
  
  ctx.fillStyle = produitsGradient;
  ctx.fillRect(produitsX, produitsY, barWidth, produitsHeight);
  
  // Dessine les labels
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 14px Segoe UI';
  ctx.textAlign = 'center';
  
  // Label Charges
  ctx.fillText('CHARGES', chargesX + barWidth / 2, padding + chartHeight + 25);
  ctx.fillText(Utils.formatCurrency(totalCharges), chargesX + barWidth / 2, padding + chartHeight + 45);
  
  // Label Produits
  ctx.fillText('PRODUITS', produitsX + barWidth / 2, padding + chartHeight + 25);
  ctx.fillText(Utils.formatCurrency(totalProduits), produitsX + barWidth / 2, padding + chartHeight + 45);
  
  // Titre
  ctx.font = 'bold 16px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText('Comparaison Charges / Produits', width / 2, 25);
  
  // Ligne de référence (max)
  ctx.strokeStyle = '#bdc3c7';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(width - padding, padding);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Label axe Y
  ctx.fillStyle = '#7f8c8d';
  ctx.font = '12px Segoe UI';
  ctx.textAlign = 'right';
  ctx.fillText(Utils.formatCurrency(maxVal), padding - 5, padding + 5);
  ctx.fillText('0', padding - 5, padding + chartHeight + 5);
}

// Initialise la page quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('resultat.html')) {
    initResultat();
  }
});
