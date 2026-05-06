"""
Classe principale AccountingExcelGenerator.
Point d'entrée unique pour générer des fichiers Excel comptables complets.
"""

from typing import List, Optional, Union
from datetime import datetime
import os

from .workbook_builder import WorkbookBuilder
from .journal import JournalManager
from .grand_livre import GrandLivreManager
from .balance import BalanceManager
from .compte_resultat import CompteResultatManager
from .bilan import BilanManager
from .utils import validate_entry


class AccountingExcelGenerator:
    """
    Classe principale pour générer des fichiers Excel de comptabilité complète.
    
    Cette classe fournit une interface simplifiée pour:
    - Créer un nouveau classeur comptable
    - Ajouter des écritures comptables
    - Générer automatiquement toutes les feuilles (Journal, Grand Livre, Balance, etc.)
    - Sauvegarder le fichier final
    
    Example:
        >>> generator = AccountingExcelGenerator("compta.xlsx")
        >>> generator.add_entry("2024-01-15", "ACH", "607000", "Achat marchandises", 1000, 0)
        >>> generator.add_entry("2024-01-15", "401000", "Fournisseur XYZ", 0, 1000)
        >>> generator.create_full_workbook()
        >>> generator.save()
    
    Attributes:
        filename: Nom du fichier Excel
        workbook_builder: Instance de WorkbookBuilder
    """
    
    def __init__(self, filename: str):
        """
        Initialise le générateur Excel comptable.
        
        Args:
            filename: Chemin complet du fichier Excel à créer
            
        Raises:
            ValueError: Si le nom de fichier est invalide
        """
        if not filename or not filename.endswith('.xlsx'):
            raise ValueError("Le nom de fichier doit se terminer par '.xlsx'")
        
        self.filename = filename
        self.workbook_builder = WorkbookBuilder(filename)
        
        # Initialiser les gestionnaires
        self.journal_manager = JournalManager(self.workbook_builder)
        self.grand_livre_manager = GrandLivreManager(self.workbook_builder)
        self.balance_manager = BalanceManager(self.workbook_builder)
        self.compte_resultat_manager = CompteResultatManager(self.workbook_builder)
        self.bilan_manager = BilanManager(self.workbook_builder)
        
        self._sheets_created = False
    
    def add_entry(self, date_val: Union[str, datetime], journal: str, 
                  account: str, label: str, debit: float = 0, 
                  credit: float = 0, validate: bool = True) -> bool:
        """
        Ajoute une écriture comptable.
        
        Args:
            date_val: Date de l'écriture (string YYYY-MM-DD ou datetime)
            journal: Code du journal (ACH, VEN, BAN, CAI, OD, Rappro)
            account: Numéro de compte (6 chiffres)
            label: Libellé de l'écriture (max 255 caractères)
            debit: Montant au débit (0 si crédit uniquement)
            credit: Montant au crédit (0 si débit uniquement)
            validate: Si True, valide l'écriture avant ajout
            
        Returns:
            True si l'écriture a été ajoutée avec succès, False sinon
            
        Raises:
            ValueError: Si la validation échoue et validate=True
            
        Example:
            >>> generator.add_entry("2024-01-15", "VEN", "707000", "Vente produits", 5000, 0)
            >>> generator.add_entry("2024-01-15", "411000", "Client ABC", 0, 5000)
        """
        # Validation
        if validate:
            is_valid, error_msg = validate_entry(date_val, journal, account, debit, credit)
            if not is_valid:
                raise ValueError(f"Écriture invalide: {error_msg}")
        
        # Limiter la longueur du libellé
        if label and len(label) > 255:
            label = label[:255]
        
        # Ajouter en mémoire
        self.workbook_builder.add_entry_to_memory(
            date_val=date_val,
            journal=journal.upper(),
            account=account,
            label=label,
            debit=float(debit) if debit else 0.0,
            credit=float(credit) if credit else 0.0
        )
        
        return True
    
    def add_entries(self, entries: List[dict], validate: bool = True) -> int:
        """
        Ajoute plusieurs écritures en une seule fois.
        
        Args:
            entries: Liste de dictionnaires avec clés:
                     - date: Date (string ou datetime)
                     - journal: Code journal
                     - account: Numéro de compte
                     - label: Libellé
                     - debit: Montant débit (optionnel, défaut 0)
                     - credit: Montant crédit (optionnel, défaut 0)
            validate: Si True, valide chaque écriture
            
        Returns:
            Nombre d'écritures ajoutées avec succès
            
        Example:
            >>> entries = [
            ...     {"date": "2024-01-15", "journal": "VEN", "account": "707000", 
            ...      "label": "Vente produits", "debit": 5000, "credit": 0},
            ...     {"date": "2024-01-15", "journal": "411000", "account": "Client ABC", 
            ...      "label": "", "debit": 0, "credit": 5000}
            ... ]
            >>> generator.add_entries(entries)
        """
        count = 0
        for entry in entries:
            try:
                self.add_entry(
                    date_val=entry.get("date"),
                    journal=entry.get("journal", ""),
                    account=entry.get("account", ""),
                    label=entry.get("label", ""),
                    debit=entry.get("debit", 0),
                    credit=entry.get("credit", 0),
                    validate=validate
                )
                count += 1
            except (ValueError, KeyError) as e:
                # Continuer avec les autres écritures
                pass
        
        return count
    
    def create_journal_sheet(self) -> None:
        """
        Crée la feuille Journal avec toutes les écritures.
        """
        self.journal_manager.create_sheet()
        self.journal_manager.add_entries_from_memory()
    
    def create_grand_livre_sheet(self) -> None:
        """
        Crée la feuille Grand Livre.
        """
        self.grand_livre_manager.create_sheet()
        self.grand_livre_manager.generate_from_entries()
        self.grand_livre_manager.apply_column_widths()
    
    def create_balance_sheet(self) -> None:
        """
        Crée la feuille Balance comptable.
        """
        self.balance_manager.create_sheet()
        self.balance_manager.generate_from_entries()
        self.balance_manager.apply_column_widths()
    
    def create_compte_resultat_sheet(self) -> None:
        """
        Crée la feuille Compte de Résultat.
        """
        self.compte_resultat_manager.create_sheet()
        self.compte_resultat_manager.generate_from_entries()
    
    def create_bilan_sheet(self) -> None:
        """
        Crée la feuille Bilan.
        """
        self.bilan_manager.create_sheet()
        self.bilan_manager.generate_from_entries()
    
    def create_full_workbook(self) -> None:
        """
        Crée le classeur Excel complet avec toutes les feuilles.
        
        Cette méthode génère automatiquement:
        1. Journal - Toutes les écritures chronologiques
        2. Grand Livre - Détail par compte
        3. Balance - Totaux et soldes par compte
        4. Compte de Résultat - Produits et charges
        5. Bilan - Actif et Passif
        
        Example:
            >>> generator = AccountingExcelGenerator("compta.xlsx")
            >>> generator.add_entry(...)
            >>> generator.create_full_workbook()
            >>> generator.save()
        """
        # Créer le Journal en premier (feuille principale)
        self.create_journal_sheet()
        
        # Créer le Grand Livre
        self.create_grand_livre_sheet()
        
        # Créer la Balance
        self.create_balance_sheet()
        
        # Créer le Compte de Résultat
        self.create_compte_resultat_sheet()
        
        # Créer le Bilan
        self.create_bilan_sheet()
        
        self._sheets_created = True
    
    def save(self, path: Optional[str] = None) -> str:
        """
        Sauvegarde le fichier Excel.
        
        Args:
            path: Chemin optionnel (utilise le chemin initial si non spécifié)
            
        Returns:
            Chemin complet du fichier sauvegardé
            
        Raises:
            RuntimeError: Si aucune feuille n'a été créée
        """
        if not self._sheets_created:
            # Créer automatiquement si pas encore fait
            self.create_full_workbook()
        
        save_path = self.workbook_builder.save(path)
        return save_path
    
    def close(self) -> str:
        """
        Sauvegarde et ferme le classeur.
        
        Returns:
            Chemin du fichier sauvegardé
        """
        return self.save()
    
    def get_entries_count(self) -> int:
        """
        Retourne le nombre d'écritures en mémoire.
        
        Returns:
            Nombre d'écritures
        """
        return self.workbook_builder.entries_count
    
    def get_total_debit(self) -> float:
        """
        Retourne le total des débits.
        
        Returns:
            Total des débits
        """
        return self.workbook_builder.total_debit
    
    def get_total_credit(self) -> float:
        """
        Retourne le total des crédits.
        
        Returns:
            Total des crédits
        """
        return self.workbook_builder.total_credit
    
    def is_balanced(self) -> bool:
        """
        Vérifie si les écritures sont équilibrées.
        
        Returns:
            True si Débit = Crédit (à 0.01 près)
        """
        return self.workbook_builder.is_balanced
    
    def clear(self) -> None:
        """
        Vide toutes les écritures et réinitialise le générateur.
        """
        self.workbook_builder.clear_entries()
        self._sheets_created = False
    
    def get_summary(self) -> dict:
        """
        Retourne un résumé des données comptables.
        
        Returns:
            Dictionnaire avec:
            - entries_count: Nombre d'écritures
            - total_debit: Total des débits
            - total_credit: Total des crédits
            - is_balanced: État d'équilibre
            - accounts_count: Nombre de comptes uniques
        """
        entries = self.workbook_builder.get_entries()
        accounts = set(e["account"] for e in entries)
        
        return {
            "entries_count": len(entries),
            "total_debit": self.get_total_debit(),
            "total_credit": self.get_total_credit(),
            "is_balanced": self.is_balanced(),
            "accounts_count": len(accounts),
            "filename": self.filename
        }
    
    def __repr__(self) -> str:
        """Représentation string du générateur."""
        return f"AccountingExcelGenerator('{self.filename}', {self.get_entries_count()} écritures)"
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - sauvegarde automatique."""
        self.save()
        return False
