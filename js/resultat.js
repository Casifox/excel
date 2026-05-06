/**
 * ============================================
 * RESULTAT.JS - GESTION DU COMPTE DE RÉSULTAT
 * ============================================
 * Calcul et affichage du résultat (Produits - Charges)
 */

/**
 * Initialise la page Résultat au chargement
 */
document.addEventListener('DOMContentLoaded', function() {
    renderResultat();
});

/**
 * Calcule et affiche le compte de résultat
 */
function renderResultat() {
    const entries = Storage.loadData();
    const chargesTbody = document.getElementById('charges-tbody');
    const produitsTbody = document.getElementById('produits-tbody');
    const emptyMessage = document.getElementById('empty-message');
    
    if (!chargesTbody || !produitsTbody) return;
    
    // Si aucune donnée
    if (entries.length === 0) {
        emptyMessage?.classList.remove('hidden');
        document.querySelector('.bilan-section')?.classList.add('hidden');
        document.querySelector('.table-container.mt-3')?.classList.add('hidden');
        return;
    }
    
    emptyMessage?.classList.add('hidden');
    document.querySelector('.bilan-section')?.classList.remove('hidden');
    document.querySelector('.table-container.mt-3')?.classList.remove('hidden');
    
    // Séparer charges (classe 6) et produits (classe 7)
    const charges = {};
    const produits = {};
    
    entries.forEach(entry => {
        const accountCode = entry.account.toString();
        const firstDigit = accountCode.charAt(0);
        const amount = (parseFloat(entry.debit) || 0) + (parseFloat(entry.credit) || 0);
        
        if (firstDigit === '6') {
            // Charge - on prend le débit
            const chargeAmount = parseFloat(entry.debit) || 0;
            if (chargeAmount > 0) {
                if (!charges[accountCode]) {
                    charges[accountCode] = {
                        code: accountCode,
                        label: entry.label || 'Charge ' + accountCode,
                        total: 0
                    };
                }
                charges[accountCode].total += chargeAmount;
                if (entry.label && entry.label !== 'Charge ' + accountCode) {
                    charges[accountCode].label = entry.label;
                }
            }
        } else if (firstDigit === '7') {
            // Produit - on prend le crédit
            const produitAmount = parseFloat(entry.credit) || 0;
            if (produitAmount > 0) {
                if (!produits[accountCode]) {
                    produits[accountCode] = {
                        code: accountCode,
                        label: entry.label || 'Produit ' + accountCode,
                        total: 0
                    };
                }
                produits[accountCode].total += produitAmount;
                if (entry.label && entry.label !== 'Produit ' + accountCode) {
                    produits[accountCode].label = entry.label;
                }
            }
        }
    });
    
    // Trier par code
    const sortedCharges = Object.values(charges).sort((a, b) => a.code.localeCompare(b.code));
    const sortedProduits = Object.values(produits).sort((a, b) => a.code.localeCompare(b.code));
    
    // Calculer les totaux
    const totalCharges = sortedCharges.reduce((sum, c) => sum + c.total, 0);
    const totalProduits = sortedProduits.reduce((sum, p) => sum + p.total, 0);
    const resultatNet = totalProduits - totalCharges;
    
    // Afficher les charges
    if (sortedCharges.length === 0) {
        chargesTbody.innerHTML = '<tr><td colspan="3" class="text-center">Aucune charge</td></tr>';
    } else {
        chargesTbody.innerHTML = sortedCharges.map(charge => `
            <tr>
                <td>${charge.code}</td>
                <td>${charge.label}</td>
                <td class="amount-cell negative">${Utils.formatCurrency(charge.total)}</td>
            </tr>
        `).join('');
    }
    
    // Afficher les produits
    if (sortedProduits.length === 0) {
        produitsTbody.innerHTML = '<tr><td colspan="3" class="text-center">Aucun produit</td></tr>';
    } else {
        produitsTbody.innerHTML = sortedProduits.map(produit => `
            <tr>
                <td>${produit.code}</td>
                <td>${produit.label}</td>
                <td class="amount-cell positive">${Utils.formatCurrency(produit.total)}</td>
            </tr>
        `).join('');
    }
    
    // Mettre à jour les totaux
    document.getElementById('total-charges').textContent = Utils.formatCurrency(totalCharges);
    document.getElementById('total-produits').textContent = Utils.formatCurrency(totalProduits);
    document.getElementById('resultat-charges').textContent = Utils.formatCurrency(totalCharges);
    document.getElementById('resultat-produits').textContent = Utils.formatCurrency(totalProduits);
    
    // Afficher le résultat net
    const resultatNetEl = document.getElementById('resultat-net');
    resultatNetEl.textContent = Utils.formatCurrency(resultatNet);
    resultatNetEl.className = `amount-cell ${resultatNet >= 0 ? 'positive' : 'negative'}`;
    
    // Dessiner le graphique
    drawChart(totalCharges, totalProduits, resultatNet);
}

/**
 * Dessine un graphique simple avec Canvas
 * @param {number} charges - Total des charges
 * @param {number} produits - Total des produits
 * @param {number} resultat - Résultat net
 */
function drawChart(charges, produits, resultat) {
    const canvas = document.getElementById('chart-resultat');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Ajuster la taille du canvas
    const container = canvas.parentElement;
    canvas.width = container.clientWidth - 48;
    canvas.height = 300;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 60;
    
    // Effacer le canvas
    ctx.clearRect(0, 0, width, height);
    
    // Si pas de données
    if (charges === 0 && produits === 0) {
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '16px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('Aucune donnée à afficher', width / 2, height / 2);
        return;
    }
    
    // Trouver la valeur maximale pour l'échelle
    const maxValue = Math.max(charges, produits, Math.abs(resultat)) * 1.2;
    
    // Dessiner les barres
    const barWidth = 80;
    const gap = 40;
    const totalBarsWidth = (barWidth * 3) + (gap * 2);
    const startX = (width - totalBarsWidth) / 2 + barWidth / 2;
    
    const chartHeight = height - (padding * 2);
    
    // Fonction pour dessiner une barre
    function drawBar(x, value, color, label) {
        const barHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
        const y = height - padding - barHeight;
        
        // Barre
        ctx.fillStyle = color;
        ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);
        
        // Valeur
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 14px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(Utils.formatCurrency(value), x, y - 10);
        
        // Label
        ctx.font = '12px Segoe UI';
        ctx.fillText(label, x, height - padding + 20);
    }
    
    // Dessiner Charges (rouge)
    drawBar(startX, charges, '#e74c3c', 'Charges');
    
    // Dessiner Produits (vert)
    drawBar(startX + barWidth + gap, produits, '#27ae60', 'Produits');
    
    // Dessiner Résultat (bleu ou orange si négatif)
    const resultatColor = resultat >= 0 ? '#3498db' : '#f39c12';
    const resultatLabel = resultat >= 0 ? 'Bénéfice' : 'Perte';
    drawBar(startX + (barWidth + gap) * 2, Math.abs(resultat), resultatColor, resultatLabel);
    
    // Ligne de base
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
}
