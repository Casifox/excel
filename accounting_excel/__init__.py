"""
Accounting Excel Generator - Librairie Python pour générer des fichiers Excel de comptabilité
Compatible Excel 2016+, sans macros, utilisant openpyxl
"""

from .workbook_builder import WorkbookBuilder
from .journal import JournalManager
from .grand_livre import GrandLivreManager
from .balance import BalanceManager
from .compte_resultat import CompteResultatManager
from .bilan import BilanManager
from .utils import AccountingStyles, format_currency, validate_entry
from .generator import AccountingExcelGenerator

__version__ = "1.0.0"
__author__ = "Accounting Excel Generator"

__all__ = [
    "AccountingExcelGenerator",
    "WorkbookBuilder",
    "JournalManager",
    "GrandLivreManager",
    "BalanceManager",
    "CompteResultatManager",
    "BilanManager",
    "AccountingStyles",
    "format_currency",
    "validate_entry",
]
