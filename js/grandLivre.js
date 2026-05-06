/**
 * ============================================
 * GRANDLIVRE.JS - GESTION DU GRAND LIVRE
 * ============================================
 * Affichage détaillé des mouvements par compte
 */

/**
 * Initialise la page Grand Livre au chargement
 */
document.addEventListener('DOMContentLoaded', function() {
    renderGrandLivre();
});

/**
 * Calcule et affiche le grand livre
 */
function renderGrandLivre() {
    const entries = Storage.loadData();
    const container = document.getElementById('grand-livre-container');
    const emptyMessage = document.getElementById('empty-message');
    
    if (!container) return;
    
    // Si aucune donnée
    if (entries.length === 0) {
        emptyMessage?.classList.remove('hidden');
        container.innerHTML = '';
        return;
    }
    
    emptyMessage?.classList.add('hidden');
    
    // Regrouper par compte
    const accounts = {};
    
    entries.forEach(entry => {
        const accountCode = entry.account.toString();
        
        if (!accounts[accountCode]) {
            accounts[accountCode] = {
                code: accountCode,
                label: entry.label || 'Compte ' + accountCode,
                entries: [],
                totalDebit: 0,
                totalCredit: 0
            };
        }
        
        accounts[accountCode].entries.push({
            date: entry.date,
            journal: entry.journal,
            label: entry.label,
            debit: parseFloat(entry.debit) || 0,
            credit: parseFloat(entry.credit) || 0
        });
        
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
    
    // Générer le HTML pour chaque compte
    container.innerHTML = sortedAccounts.map(account => {
        // Calculer le solde
        const solde = account.totalDebit - account.totalCredit;
        const soldeClass = solde >= 0 ? 'positive' : 'negative';
        const soldeText = solde >= 0 ? 'Solde débiteur' : 'Solde créditeur';
        
        return `
            <div class="account-section">
                <div class="account-header">
                    <h3>Compte ${account.code} - ${account.label}</h3>
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
                            ${account.entries.map(entry => `
                                <tr>
                                    <td>${entry.date}</td>
                                    <td>${entry.journal}</td>
                                    <td>${entry.label}</td>
                                    <td class="amount-cell ${entry.debit > 0 ? 'positive' : ''}">${entry.debit > 0 ? Utils.formatCurrency(entry.debit) : '-'}</td>
                                    <td class="amount-cell ${entry.credit > 0 ? 'negative' : ''}">${entry.credit > 0 ? Utils.formatCurrency(entry.credit) : '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="balance-row">
                                <td colspan="3" class="text-right"><strong>Totaux</strong></td>
                                <td class="amount-cell"><strong>${Utils.formatCurrency(account.totalDebit)}</strong></td>
                                <td class="amount-cell"><strong>${Utils.formatCurrency(account.totalCredit)}</strong></td>
                            </tr>
                            <tr class="${soldeClass}">
                                <td colspan="3" class="text-right"><strong>${soldeText}:</strong></td>
                                <td colspan="2" class="amount-cell"><strong>${Utils.formatCurrency(Math.abs(solde))}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
    }).join('');
}
