"""
Exemple d'utilisation de la librairie Accounting Excel Generator.

Ce script démontre comment:
1. Créer un générateur Excel comptable
2. Ajouter des écritures réalistes
3. Générer toutes les feuilles automatiquement
4. Sauvegarder le fichier final
"""

from accounting_excel import AccountingExcelGenerator


def main():
    """
    Fonction principale d'exemple.
    Génère un fichier Excel complet avec 10 écritures comptables réalistes.
    """
    
    print("=" * 60)
    print("ACCOUNTING EXCEL GENERATOR - EXEMPLE D'UTILISATION")
    print("=" * 60)
    
    # Nom du fichier à générer
    filename = "exemple_comptabilite.xlsx"
    
    # Création du générateur
    print(f"\n[1] Initialisation du générateur pour: {filename}")
    generator = AccountingExcelGenerator(filename)
    
    # Écritures comptables réalistes pour une TPE/PME française
    # Scénario: Une société de services qui démarre son activité
    
    print("\n[2] Ajout des écritures comptables...")
    
    entries = [
        # === ÉCRITURES DE CONSTITUTION (Janvier) ===
        {
            "date": "2024-01-02",
            "journal": "BAN",
            "account": "512000",
            "label": "Apport en capital - Souscription parts sociales",
            "debit": 10000.00,
            "credit": 0
        },
        {
            "date": "2024-01-02",
            "journal": "BAN",
            "account": "101000",
            "label": "Capital social - Constitution société",
            "debit": 0,
            "credit": 10000.00
        },
        
        # === ACHAT MATÉRIEL INFORMATIQUE (Janvier) ===
        {
            "date": "2024-01-05",
            "journal": "ACH",
            "account": "218300",
            "label": "Achat matériel informatique - 3 ordinateurs portables",
            "debit": 2400.00,
            "credit": 0
        },
        {
            "date": "2024-01-05",
            "journal": "ACH",
            "account": "445660",
            "label": "TVA déductible sur immobilisations - 20%",
            "debit": 480.00,
            "credit": 0
        },
        {
            "date": "2024-01-05",
            "journal": "ACH",
            "account": "404000",
            "label": "Fournisseur d'immobilisations - TechStore SARL",
            "debit": 0,
            "credit": 2880.00
        },
        
        # === PREMIÈRE VENTE DE PRESTATIONS (Janvier) ===
        {
            "date": "2024-01-15",
            "journal": "VEN",
            "account": "411000",
            "label": "Client ABC Industries - Facture F2024-001",
            "debit": 6000.00,
            "credit": 0
        },
        {
            "date": "2024-01-15",
            "journal": "VEN",
            "account": "706000",
            "label": "Prestations de services - Consulting IT",
            "debit": 0,
            "credit": 5000.00
        },
        {
            "date": "2024-01-15",
            "journal": "VEN",
            "account": "445710",
            "label": "TVA collectée - 20%",
            "debit": 0,
            "credit": 1000.00
        },
        
        # === PAIEMENT FOURNISSEUR (Février) ===
        {
            "date": "2024-02-01",
            "journal": "BAN",
            "account": "404000",
            "label": "Règlement facture TechStore - Chèque n°1234",
            "debit": 2880.00,
            "credit": 0
        },
        {
            "date": "2024-02-01",
            "journal": "BAN",
            "account": "512000",
            "label": "Débit compte bancaire",
            "debit": 0,
            "credit": 2880.00
        },
        
        # === ENCAISSEMENT CLIENT (Février) ===
        {
            "date": "2024-02-10",
            "journal": "BAN",
            "account": "512000",
            "label": "Virement reçu - Client ABC Industries",
            "debit": 6000.00,
            "credit": 0
        },
        {
            "date": "2024-02-10",
            "journal": "BAN",
            "account": "411000",
            "label": "Crédit client ABC Industries",
            "debit": 0,
            "credit": 6000.00
        },
        
        # === ACHATS FOURNITURES BUREAU (Février) ===
        {
            "date": "2024-02-15",
            "journal": "ACH",
            "account": "606400",
            "label": "Fournitures administratives - Bureau Vallée",
            "debit": 150.00,
            "credit": 0
        },
        {
            "date": "2024-02-15",
            "journal": "ACH",
            "account": "445660",
            "label": "TVA déductible sur autres biens - 20%",
            "debit": 30.00,
            "credit": 0
        },
        {
            "date": "2024-02-15",
            "journal": "ACH",
            "account": "401000",
            "label": "Fournisseur Bureau Vallée",
            "debit": 0,
            "credit": 180.00
        },
        
        # === DEUXIÈME VENTE (Mars) ===
        {
            "date": "2024-03-01",
            "journal": "VEN",
            "account": "411000",
            "label": "Client XYZ Corp - Facture F2024-002",
            "debit": 9600.00,
            "credit": 0
        },
        {
            "date": "2024-03-01",
            "journal": "VEN",
            "account": "706000",
            "label": "Prestations de services - Développement application",
            "debit": 0,
            "credit": 8000.00
        },
        {
            "date": "2024-03-01",
            "journal": "VEN",
            "account": "445710",
            "label": "TVA collectée - 20%",
            "debit": 0,
            "credit": 1600.00
        },
        
        # === FRAIS BANCAIRES (Mars) ===
        {
            "date": "2024-03-31",
            "journal": "BAN",
            "account": "627000",
            "label": "Frais bancaires - Tenue de compte Q1",
            "debit": 45.00,
            "credit": 0
        },
        {
            "date": "2024-03-31",
            "journal": "BAN",
            "account": "512000",
            "label": "Prélèvement frais bancaires",
            "debit": 0,
            "credit": 45.00
        },
        
        # === ASSURANCE PROFESSIONNELLE (Mars) ===
        {
            "date": "2024-03-31",
            "journal": "ACH",
            "account": "616000",
            "label": "Prime assurance RC Pro - AXA",
            "debit": 320.00,
            "credit": 0
        },
        {
            "date": "2024-03-31",
            "journal": "ACH",
            "account": "445660",
            "label": "TVA déductible assurance - 20%",
            "debit": 64.00,
            "credit": 0
        },
        {
            "date": "2024-03-31",
            "journal": "ACH",
            "account": "401000",
            "label": "Assureur AXA",
            "debit": 0,
            "credit": 384.00
        },
    ]
    
    # Ajouter toutes les écritures
    count = generator.add_entries(entries)
    print(f"    ✓ {count} écritures ajoutées avec succès")
    
    # Afficher un résumé
    print("\n[3] Résumé des données:")
    summary = generator.get_summary()
    print(f"    • Nombre d'écritures: {summary['entries_count']}")
    print(f"    • Nombre de comptes:  {summary['accounts_count']}")
    print(f"    • Total Débit:        {summary['total_debit']:,.2f} €")
    print(f"    • Total Crédit:       {summary['total_credit']:,.2f} €")
    print(f"    • Équilibré:          {'✓ Oui' if summary['is_balanced'] else '✗ Non'}")
    
    # Génération du classeur complet
    print("\n[4] Génération du classeur Excel complet...")
    print("    • Feuille: Journal (écritures chronologiques)")
    print("    • Feuille: Grand Livre (détail par compte)")
    print("    • Feuille: Balance (totaux et soldes)")
    print("    • Feuille: Compte de Résultat (produits/charges)")
    print("    • Feuille: Bilan (actif/passif)")
    
    generator.create_full_workbook()
    print("    ✓ Toutes les feuilles générées")
    
    # Sauvegarde
    print(f"\n[5] Sauvegarde du fichier: {filename}")
    saved_path = generator.save()
    print(f"    ✓ Fichier sauvegardé: {saved_path}")
    
    # Vérification finale
    print("\n[6] Vérifications finales:")
    print(f"    • Total Débit:   {generator.get_total_debit():,.2f} €")
    print(f"    • Total Crédit:  {generator.get_total_credit():,.2f} €")
    print(f"    • Différence:    {abs(generator.get_total_debit() - generator.get_total_credit()):,.2f} €")
    print(f"    • État:          {'✓ COMPTABILITÉ ÉQUILIBRÉE' if generator.is_balanced() else '✗ DÉSÉQUILIBRE'}")
    
    print("\n" + "=" * 60)
    print("GÉNÉRATION TERMINÉE AVEC SUCCÈS!")
    print(f"Ouvrez le fichier '{filename}' dans Excel pour visualiser les résultats.")
    print("=" * 60)
    
    return saved_path


if __name__ == "__main__":
    main()
