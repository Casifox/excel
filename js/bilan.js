/**
 * ============================================
 * BILAN.JS - GESTION DU BILAN COMPTABLE
 * ============================================
 * Calcul et affichage du bilan (Actif / Passif)
 */

/**
 * Initialise la page Bilan au chargement
 */
document.addEventListener('DOMContentLoaded', function() {
    renderBilan();
});

/**
 * Calcule et affiche le bilan comptable
 */
function renderBilan() {
    const entries = Storage.loadData();
    const actifTbody = document.getElementById('actif-tbody');
    const passifTbody = document.getElementById('passif-tbody');
    const emptyMessage = document.getElementById('empty-message');
    
    if (!actifTbody || !passifTbody) return;
    
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
    
    // Calculer les soldes par compte depuis la balance
    const accounts = calculateAccountBalances(entries);
    
    // Séparer Actif et Passif
    const actif = [];
    const passif = [];
    
    Object.values(accounts).forEach(account => {
        const firstDigit = account.code.charAt(0);
        const soldeDebiteur = account.totalDebit - account.totalCredit;
        const soldeCrediteur = account.totalCredit - account.totalDebit;
        
        // Déterminer si c'est un compte d'actif ou de passif
        let isActif = false;
        
        // Comptes d'actif : 1, 2, 3, 5 (sauf certains comptes de régularisation)
        // Comptes de passif : 4 (dettes), 1 (capitaux avec solde créditeur)
        if (['1', '2', '3', '5'].includes(firstDigit)) {
            isActif = true;
        } else if (firstDigit === '4') {
            isActif = false; // Dettes = Passif
        }
        
        // Pour les comptes de classe 1, vérifier le solde
        if (firstDigit === '1') {
            if (soldeCrediteur > soldeDebiteur) {
                isActif = false; // Capital = Passif
            } else {
                isActif = true; // Certaines immobilisations en réduction
            }
        }
        
        const amount = Math.max(soldeDebiteur, soldeCrediteur);
        
        if (amount > 0.01) {
            if (isActif) {
                actif.push({
                    code: account.code,
                    label: account.label,
                    amount: soldeDebiteur > 0 ? soldeDebiteur : 0
                });
            } else {
                passif.push({
                    code: account.code,
                    label: account.label,
                    amount: soldeCrediteur > 0 ? soldeCrediteur : soldeDebiteur
                });
            }
        }
    });
    
    // Trier par code
    actif.sort((a, b) => a.code.localeCompare(b.code));
    passif.sort((a, b) => a.code.localeCompare(b.code));
    
    // Calculer les totaux
    const totalActif = actif.reduce((sum, item) => sum + item.amount, 0);
    const totalPassif = passif.reduce((sum, item) => sum + item.amount, 0);
    
    // Afficher l'actif
    if (actif.length === 0) {
        actifTbody.innerHTML = '<tr><td colspan="3" class="text-center">Aucun élément d\'actif</td></tr>';
    } else {
        actifTbody.innerHTML = actif.map(item => `
            <tr>
                <td>${item.code}</td>
                <td>${item.label}</td>
                <td class="amount-cell">${Utils.formatCurrency(item.amount)}</td>
            </tr>
        `).join('');
    }
    
    // Afficher le passif
    if (passif.length === 0) {
        passifTbody.innerHTML = '<tr><td colspan="3" class="text-center">Aucun élément de passif</td></tr>';
    } else {
        passifTbody.innerHTML = passif.map(item => `
            <tr>
                <td>${item.code}</td>
                <td>${item.label}</td>
                <td class="amount-cell">${Utils.formatCurrency(item.amount)}</td>
            </tr>
        `).join('');
    }
    
    // Mettre à jour les totaux
    document.getElementById('total-actif').textContent = Utils.formatCurrency(totalActif);
    document.getElementById('total-passif').textContent = Utils.formatCurrency(totalPassif);
    document.getElementById('bilan-actif').textContent = Utils.formatCurrency(totalActif);
    document.getElementById('bilan-passif').textContent = Utils.formatCurrency(totalPassif);
    
    // Vérifier l'équilibre
    const ecart = Math.abs(totalActif - totalPassif);
    const rowEcart = document.getElementById('row-ecart');
    const bilanEcart = document.getElementById('bilan-ecart');
    const bilanStatut = document.getElementById('bilan-statut');
    
    if (ecart > 0.01) {
        rowEcart?.classList.remove('hidden');
        bilanEcart.textContent = Utils.formatCurrency(ecart);
        bilanStatut.innerHTML = '<span class="negative">❌ Déséquilibré</span>';
    } else {
        rowEcart?.classList.add('hidden');
        bilanStatut.innerHTML = '<span class="positive">✅ Équilibré</span>';
    }
}

/**
 * Calcule les soldes par compte à partir des écritures
 * @param {Array} entries - Tableau des écritures
 * @returns {Object} - Soldes par compte
 */
function calculateAccountBalances(entries) {
    const accounts = {};
    
    entries.forEach(entry => {
        const accountCode = entry.account.toString();
        
        if (!accounts[accountCode]) {
            accounts[accountCode] = {
                code: accountCode,
                label: entry.label || 'Compte ' + accountCode,
                totalDebit: 0,
                totalCredit: 0
            };
        }
        
        accounts[accountCode].totalDebit += parseFloat(entry.debit) || 0;
        accounts[accountCode].totalCredit += parseFloat(entry.credit) || 0;
        
        if (entry.label && entry.label !== 'Compte ' + accountCode) {
            accounts[accountCode].label = entry.label;
        }
    });
    
    return accounts;
}
