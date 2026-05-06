/**
 * ============================================
 * DASHBOARD.JS - GESTION DU TABLEAU DE BORD
 * ============================================
 * Affichage des indicateurs clés et graphiques
 */

/**
 * Initialise le Dashboard au chargement
 */
document.addEventListener('DOMContentLoaded', function() {
    renderDashboard();
});

/**
 * Calcule et affiche le dashboard
 */
function renderDashboard() {
    const entries = Storage.loadData();
    
    // Calculer les indicateurs
    const soldeBancaire = calculateSoldeBancaire(entries);
    const totalProduits = calculateTotalProduits(entries);
    const totalCharges = calculateTotalCharges(entries);
    const resultatNet = totalProduits - totalCharges;
    
    // Afficher les cartes
    document.getElementById('solde-bancaire').textContent = Utils.formatCurrency(soldeBancaire);
    document.getElementById('total-produits').textContent = Utils.formatCurrency(totalProduits);
    document.getElementById('total-charges').textContent = Utils.formatCurrency(totalCharges);
    
    const resultatNetEl = document.getElementById('resultat-net');
    resultatNetEl.textContent = Utils.formatCurrency(resultatNet);
    resultatNetEl.className = `amount ${resultatNet >= 0 ? 'positive' : 'negative'}`;
    
    // Afficher les dernières écritures
    renderDernieresEcritures(entries);
    
    // Dessiner le graphique
    drawChart(totalCharges, totalProduits, resultatNet);
}

/**
 * Calcule le solde bancaire (comptes de classe 5)
 * @param {Array} entries - Tableau des écritures
 * @returns {number} - Solde bancaire
 */
function calculateSoldeBancaire(entries) {
    let solde = 0;
    
    entries.forEach(entry => {
        const accountCode = entry.account.toString();
        if (accountCode.startsWith('5')) {
            solde += (parseFloat(entry.debit) || 0) - (parseFloat(entry.credit) || 0);
        }
    });
    
    return solde;
}

/**
 * Calcule le total des produits (classe 7)
 * @param {Array} entries - Tableau des écritures
 * @returns {number} - Total produits
 */
function calculateTotalProduits(entries) {
    let total = 0;
    
    entries.forEach(entry => {
        const accountCode = entry.account.toString();
        if (accountCode.startsWith('7')) {
            total += parseFloat(entry.credit) || 0;
        }
    });
    
    return total;
}

/**
 * Calcule le total des charges (classe 6)
 * @param {Array} entries - Tableau des écritures
 * @returns {number} - Total charges
 */
function calculateTotalCharges(entries) {
    let total = 0;
    
    entries.forEach(entry => {
        const accountCode = entry.account.toString();
        if (accountCode.startsWith('6')) {
            total += parseFloat(entry.debit) || 0;
        }
    });
    
    return total;
}

/**
 * Affiche les 10 dernières écritures
 * @param {Array} entries - Tableau des écritures
 */
function renderDernieresEcritures(entries) {
    const tbody = document.getElementById('dernieres-ecritures-tbody');
    const emptyMessage = document.getElementById('empty-message');
    const tableContainer = document.querySelector('.recent-entries .table-container');
    
    if (!tbody) return;
    
    if (entries.length === 0) {
        emptyMessage?.classList.remove('hidden');
        tableContainer?.classList.add('hidden');
        return;
    }
    
    emptyMessage?.classList.add('hidden');
    tableContainer?.classList.remove('hidden');
    
    // Trier par date décroissante et prendre les 10 dernières
    const recentEntries = [...entries]
        .sort((a, b) => {
            const dateA = Utils.parseDate(a.date);
            const dateB = Utils.parseDate(b.date);
            return dateB - dateA;
        })
        .slice(0, 10);
    
    tbody.innerHTML = recentEntries.map(entry => `
        <tr>
            <td>${entry.date}</td>
            <td>${entry.account}</td>
            <td>${entry.label}</td>
            <td class="amount-cell ${entry.debit > 0 ? 'positive' : ''}">${entry.debit > 0 ? Utils.formatCurrency(entry.debit) : '-'}</td>
            <td class="amount-cell ${entry.credit > 0 ? 'negative' : ''}">${entry.credit > 0 ? Utils.formatCurrency(entry.credit) : '-'}</td>
        </tr>
    `).join('');
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
