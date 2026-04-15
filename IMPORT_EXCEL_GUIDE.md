# 📊 Excel Import Example - AppLogiTrack Colis

## Quick Start - How to Use the Sample File

### Option 1: Use the Sample CSV File (Recommended for Quick Testing)
1. You already have: `sample_import_example.csv`
2. Open the file in Excel (or any spreadsheet app)
3. **Save it as .xlsx format**: File → Save As → Choose Excel (.xlsx)
4. Upload to AppLogiTrack import page

### Option 2: Create Your Own Excel File
1. Open Excel or LibreOffice Calc
2. Copy the structure below
3. Fill with your data
4. Save as `.xlsx`

---

## Excel File Structure ✅

### **Required Columns** (at least one must be filled):

| Column | Type | Example | Description |
|--------|------|---------|-------------|
| **client_id** | Text | CLT-001 | Existing client ID in database |
| **client_nom** | Text | Ahmed Ben Ali | Client name (used if client_id missing) |
| **adresse_livraison** | Text | 123 Rue de la Paix Alger 16000 | Full delivery address (MANDATORY) |

### **Optional Columns** (can be empty):

| Column | Type | Example | Description |
|--------|------|---------|-------------|
| numero_suivi | Text | DZ-2024-0001 | Tracking number (auto-generated if empty) |
| entreprise_id | Text | ENT-001 | Company ID (must exist in database) |
| prix | Number | 500 | Package price in DZD |
| frais | Number | 50 | Delivery fees in DZD |
| telephone_destinataire | Text | +213661234567 | Recipient phone |
| statut | Text | nouveau | Status (default: "nouveau") |
| notes | Text | Fragile | Additional notes |
| poids | Number | 2.5 | Weight in kg |

---

## Sample Data (Copy to Excel)

### ✅ **Minimal Example** (Simplest Format)
```
client_id,adresse_livraison
CLT-001,123 Rue de la Paix Alger 16000
CLT-002,456 Avenue des Fleurs Oran 31000
CLT-003,789 Boulevard Central Constantine 25000
```

### 📋 **Complete Example** (All Columns)
```
numero_suivi,client_id,client_nom,adresse_livraison,entreprise_id,telephone_destinataire,prix,frais,statut,notes,poids
DZ-2024-0001,CLT-001,Ahmed Ben Ali,123 Rue de la Paix Alger,ENT-001,+213661234567,500,50,nouveau,Livraison urgente,2.5
DZ-2024-0002,CLT-002,Fatima Medjahed,456 Avenue des Fleurs Oran,ENT-002,+213661234568,750,75,nouveau,Fragile,1.8
DZ-2024-0003,CLT-003,Mohammed Djebbar,789 Boulevard Central Constantine,ENT-001,+213661234569,1000,100,nouveau,En haut étage,5.0
DZ-2024-0004,,Sophia Zahra,321 Rue du Commerce Annaba,ENT-003,+213661234570,600,60,nouveau,,3.2
```

### 🎯 **Real-World Example** (Mixed Data - Some Complete, Some Partial)
```
numero_suivi,client_id,client_nom,adresse_livraison,entreprise_id,prix,frais,notes
DZ-2024-0001,CLT-001,Ahmed Ben Ali,123 Rue de la Paix Alger 16000,ENT-001,500,50,Livraison urgente
DZ-2024-0002,CLT-002,Fatima Medjahed,456 Avenue des Fleurs Oran 31000,ENT-002,750,75,
DZ-2024-0003,,Mohammed Djebbar,789 Boulevard Central Constantine,ENT-001,1000,100,Fragile
```

---

## ⚠️ Important Rules & Validation

### ✅ **VALID Examples:**
- ✓ `client_id` = CLT-001 (exact ID from database)
- ✓ `adresse_livraison` = 123 Rue de la Paix Alger 16000 (complete address)
- ✓ `prix` = 500 or 500.50 (numbers only, no currency)
- ✓ `frais` = 75 (numbers only)
- ✓ Empty cells for optional columns
- ✓ Mix of client_id and client_nom

### ❌ **INVALID Examples:**
- ✗ `prix` = "500 DZD" (includes currency)
- ✗ `prix` = "cinq cents" (text instead of number)
- ✗ Empty `adresse_livraison` (required field)
- ✗ `client_id` = CLT-999 (doesn't exist in database)
- ✗ Extra spaces: "  CLT-001  " should be "CLT-001"

---

## 🔍 Column Details

### **client_id** vs **client_nom**
- If you have **client_id** → Use it (faster, more reliable)
- If you DON'T have **client_id** → Use **client_nom**
- If both are present → **client_id** takes priority

### **Prix Format**
```
Correct:    500      750.50     1000
Incorrect:  500 DZD  "750.50"   999.999
```

### **Statut Options** (if needed)
```
Typical values:
- nouveau (default)
- en cours
- livré
- refusé
- annulé
```

---

## 📥 How to Import in AppLogiTrack

1. **Go to**: Colis → Liste des Colis
2. **Click**: "Importer Excel" button (green button)
3. **Select**: Your .xlsx file
4. **Review**: Preview of data appears
5. **Check**: Any errors are shown in red
6. **Confirm**: Click "Importer" to import

---

## ✅ Before Importing - Checklist

- [ ] Client IDs exist in your database
- [ ] Company IDs (if used) exist in your database
- [ ] Adresse de livraison is filled for all rows
- [ ] Prices/fees are numbers (no currency symbols)
- [ ] No extra spaces around values
- [ ] File format is .xlsx (Excel format)
- [ ] File is not corrupted or password-protected

---

## 🎯 Common Error Messages & Fixes

### Error: "client manquant"
- **Problem**: client_id doesn't exist in database
- **Fix**: Check client_id matches what's in your Clients list, OR use client_nom instead

### Error: "adresse de livraison manquante"
- **Problem**: Delivery address is empty
- **Fix**: This column is REQUIRED for all rows - add address for each package

### Error: "entreprise introuvable"
- **Problem**: Company ID doesn't exist
- **Fix**: Check company exists in Entreprises list, or leave empty (optional)

### Error: "prix invalide"
- **Problem**: Price contains text or special characters
- **Fix**: Use numbers only: change "500 DZD" to "500"

### Error: "Format non supporté"
- **Problem**: File is not .xlsx format
- **Fix**: Save as .xlsx in Excel (File → Save As → Excel format)

---

## 📋 Testing the Import (Step by Step)

### Test 1: Simple Import
```
Use file: sample_import_example.csv
Expected result: 15 packages imported successfully
```

### Test 2: With Missing Client
```
Use file with:
- Row 1: Valid client_id
- Row 2: Empty client_id but client_nom filled
- Row 3: Invalid client_id
Expected result: Row 3 shows error, rows 1-2 import okay
```

### Test 3: Partial Data
```
Use file with only:
- client_id
- adresse_livraison
- prix (optional)
Expected result: Should import successfully
```

---

## 💾 Download & Save Instructions

### If you're using the provided sample file:
1. File location: `sample_import_example.csv`
2. Open in Excel
3. Save As: `sample_import_example.xlsx`
4. Use for testing

### Create your own:
1. Copy data from "Sample Data" section above
2. Paste in Excel
3. Save as `.xlsx`
4. Upload to AppLogiTrack

---

## 🚀 After Successful Import

- ✅ All packages appear in "Liste des Colis"
- ✅ Default status is "nouveau"
- ✅ Can be modified individually after import
- ✅ Export data anytime as Excel/CSV

---

## 📞 Troubleshooting

**File won't upload?**
- Check file format (.xlsx or .xls)
- File size under 10MB
- No corrupted characters

**Import fails without error message?**
- Try with simpler data first
- Check browser console (F12) for details
- Try different browser

**Data looks wrong in preview?**
- Click "Retour" (Back)
- Re-check Excel file
- Re-upload

---

**Generated: 2026-04-15**
**For: AppLogiTrack - Logistics Management System**
