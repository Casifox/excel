/**
 * ============================================
 * BALANCE.JS - GESTION DE LA BALANCE COMPTABLE
 * ============================================
 * Calcul et affichage de la balance par compte
 */

/**
 * Initialise la page Balance au chargement
 */
document.addEventListener('DOMContentLoaded', function() {
    renderBalance();
});

/**
 * Calcule et affiche la balance comptable
 */
function renderBalance() {
    const entries = Storage.loadData();
    const tbody = document.getElementById('balance-tbody');
    const tfoot = document.getElementById('balance-tfoot');
    const emptyMessage = document.getElementById('empty-message');
    const tableContainer = document.querySelector('.table-container');
    
    if (!tbody) return;
    
    // Si aucune donnée
    if (entries.length === 0) {
        emptyMessage?.classList.remove('hidden');
        tableContainer?.classList.add('hidden');
        return;
    }
    
    emptyMessage?.classList.add('hidden');
    tableContainer?.classList.remove('hidden');
    
    // Regrouper par compte
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
        
        // Mettre à jour le libellé si celui-ci est plus descriptif
        if (entry.label && entry.label !== 'Compte ' + accountCode) {
            accounts[accountCode].label = entry.label;
        }
    });
    
    // Trier par code compte
    const sortedAccounts = Object.values(accounts).sort((a, b) => 
        a.code.localeCompare(b.code)
    );
    
    // Calculer les totaux généraux
    let grandTotalDebit = 0;
    let grandTotalCredit = 0;
    let grandTotalSoldeDebiteur = 0;
    let grandTotalSoldeCrediteur = 0;
    
    // Générer le HTML
    tbody.innerHTML = sortedAccounts.map(account => {
        const soldeDebiteur = Math.max(0, account.totalDebit - account.totalCredit);
        const soldeCrediteur = Math.max(0, account.totalCredit - account.totalDebit);
        
        grandTotalDebit += account.totalDebit;
        grandTotalCredit += account.totalCredit;
        grandTotalSoldeDebiteur += soldeDebiteur;
        grandTotalSoldeCrediteur += soldeCrediteur;
        
        return `
            <tr>
                <td><strong>${account.code}</strong></td>
                <td>${account.label}</td>
                <td class="amount-cell">${Utils.formatCurrency(account.totalDebit)}</td>
                <td class="amount-cell">${Utils.formatCurrency(account.totalCredit)}</td>
                <td class="amount-cell ${soldeDebiteur > 0 ? 'positive' : ''}">${soldeDebiteur > 0 ? Utils.formatCurrency(soldeDebiteur) : '-'}</td>
                <td class="amount-cell ${soldeCrediteur > 0 ? 'negative' : ''}">${soldeCrediteur > 0 ? Utils.formatCurrency(soldeCrediteur) : '-'}</td>
            </tr>
        `;
    }).join('');
    
    // Afficher les totaux
    if (tfoot) {
        tfoot.innerHTML = `
            <tr class="balance-row">
                <td colspan="2" class="text-right"><strong>TOTAUX</strong></td>
                <td class="amount-cell"><strong>${Utils.formatCurrency(grandTotalDebit)}</strong></td>
                <td class="amount-cell"><strong>${Utils.formatCurrency(grandTotalCredit)}</strong></td>
                <td class="amount-cell"><strong>${Utils.formatCurrency(grandTotalSoldeDebiteur)}</strong></td>
                <td class="amount-cell"><strong>${Utils.formatCurrency(grandTotalSoldeCrediteur)}</strong></td>
            </tr>
        `;
    }
    
    // Vérifier l'équilibre
    const isBalanced = Math.abs(grandTotalDebit - grandTotalCredit) < 0.01;
    const soldeEquilibrium = Math.abs(grandTotalSoldeDebiteur - grandTotalSoldeCrediteur) < 0.01;
    
    if (!isBalanced || !soldeEquilibrium) {
        console.warn('⚠️ La balance n\'est pas équilibrée !');
    }
}
