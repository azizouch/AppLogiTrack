import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { api } from '@/lib/supabase';
import { Colis } from '@/types';
import { ImportSuccessModal } from './ImportSuccessModal';
import './ImportColisModal.css';

interface ImportColisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

interface PreviewColis {
  id?: string;
  numero_suivi?: string;
  client_id?: string;
  client_nom?: string;
  entreprise_id?: string;
  entreprise_nom?: string;
  poids?: number;
  prix?: number;
  statut?: string;
  adresse_livraison?: string;
  telephone_destinataire?: string;
  notes?: string;
  [key: string]: any;
}

type StepType = 'upload' | 'preview' | 'importing';

export function ImportColisModal({ open, onOpenChange, onImportSuccess }: ImportColisModalProps) {
  const [step, setStep] = useState<StepType>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewColis[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [importedData, setImportedData] = useState<PreviewColis[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Reset modal when it closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset to upload state when modal closes
      setStep('upload');
      setFile(null);
      setPreviewData([]);
      setErrors([]);
      setImporting(false);
      setShowPreview(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    onOpenChange(newOpen);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    try {
      setErrors([]);
      const data = await readExcelFile(selectedFile);
      
      if (data.length === 0) {
        setErrors(['Le fichier Excel est vide']);
        return;
      }

      // Validate and prepare data
      const { validRows, validationErrors } = validateColisData(data);
      
      setFile(selectedFile);
      setPreviewData(validRows);
      setErrors(validationErrors);
      setStep('preview');

      toast.success(`${validRows.length} colis trouvés dans le fichier`, {
        description: validationErrors.length > 0 ? `${validationErrors.length} erreurs détectées` : 'Prêt à importer'
      });
    } catch (error: any) {
      toast.error('Erreur lors de la lecture du fichier');
      setErrors([error.message || 'Erreur inconnue']);
    }
  };

  const readExcelFile = async (file: File): Promise<PreviewColis[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          resolve(jsonData as PreviewColis[]);
        } catch (error) {
          reject(new Error('Impossible de lire le fichier Excel'));
        }
      };

      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsBinaryString(file);
    });
  };

  const validateColisData = (data: PreviewColis[]): { validRows: PreviewColis[], validationErrors: string[] } => {
    const validRows: PreviewColis[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      const rowNum = index + 2; // Excel row number (header is row 1)
      const rowErrors: string[] = [];

      // Check required fields
      if (!row.client_id && !row.client_nom) {
        rowErrors.push(`Ligne ${rowNum}: client manquant`);
      }

      if (!row.adresse_livraison) {
        rowErrors.push(`Ligne ${rowNum}: adresse de livraison manquante`);
      }

      // Validate numeric fields
      if (row.poids && isNaN(Number(row.poids))) {
        rowErrors.push(`Ligne ${rowNum}: poids invalide`);
      }

      if (row.prix && isNaN(Number(row.prix))) {
        rowErrors.push(`Ligne ${rowNum}: prix invalide`);
      }

      if (rowErrors.length === 0) {
        // Auto-generate numero_suivi if missing
        const numeroSuivi = row.numero_suivi || row.id || `AUTO-${Date.now()}-${index}`;
        
        validRows.push({
          ...row,
          numero_suivi: numeroSuivi,
          poids: row.poids ? Number(row.poids) : null,
          prix: row.prix ? Number(row.prix) : null,
        });
      } else {
        errors.push(...rowErrors);
      }
    });

    return { validRows, validationErrors: errors };
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error('Aucun colis à importer');
      return;
    }

    setImporting(true);
    setStep('importing');

    // Simulate a brief processing delay for UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    setImporting(false);

    // Show success modal with preview data (NO database insert)
    const successCount = previewData.length;
    setSuccessCount(successCount);
    setImportedData(previewData);
    setShowSuccessModal(true);
    
    toast.success(`${successCount} colis prêts à être importés (Mode Test)`, {
      description: 'Les données ne sont pas encore enregistrées',
      icon: <CheckCircle className="h-5 w-5 text-blue-500" />
    });

    // Reset and close
    resetModal();
  };

  const resetModal = () => {
    setStep('upload');
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    setImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const file = droppedFiles[0];
      // Check if file is Excel format
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type.includes('spreadsheet')) {
        const event = {
          target: {
            files: droppedFiles
          }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileSelect(event);
      } else {
        toast.error('Veuillez déposer un fichier Excel (.xlsx ou .xls)');
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="import-colis-modal max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer des colis</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Sélectionnez un fichier Excel contenant les colis à importer'}
            {step === 'preview' && 'Vérifiez les données avant d\'importer'}
            {step === 'importing' && 'Importation en cours...'}
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Cliquez pour sélectionner un fichier Excel
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ou glissez-déposez un fichier .xlsx ou .xls
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <p className="font-medium mb-2">Colonnes requises dans votre Excel:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>client_id (ou client_nom)</li>
                <li>adresse_livraison</li>
              </ul>
              <p className="font-medium mt-3 mb-2">Colonnes optionnelles:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>numero_suivi (auto-généré si absent)</li>
                <li>entreprise_id</li>
                <li>poids</li>
                <li>prix</li>
                <li>frais</li>
                <li>statut</li>
                <li>notes</li>
              </ul>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Valides</p>
                <p className="text-2xl font-bold text-green-600">{previewData.length}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Erreurs</p>
                <p className="text-2xl font-bold text-red-600">{errors.length}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-blue-600">{previewData.length + errors.length}</p>
              </div>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Erreurs détectées:</p>
                  <ul className="text-sm space-y-1">
                    {errors.slice(0, 5).map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                    {errors.length > 5 && <li>• ... et {errors.length - 5} autres erreurs</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Data Preview Table */}
            {previewData.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Aperçu des colis valides ({previewData.length})</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="h-8"
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Masquer
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Afficher
                      </>
                    )}
                  </Button>
                </div>

                {showPreview && (
                  <div className="border rounded-lg overflow-x-auto max-h-80 table-preview-scroll" ref={tableContainerRef}>
                    <Table>
                      <TableHeader className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <TableRow>
                          <TableHead className="text-xs">N° Suivi</TableHead>
                          <TableHead className="text-xs">Client</TableHead>
                          <TableHead className="text-xs">Adresse</TableHead>
                          <TableHead className="text-xs">Téléphone</TableHead>
                          <TableHead className="text-xs">Prix</TableHead>
                          <TableHead className="text-xs">Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.slice(0, 10).map((colis, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs font-mono">
                              {colis.numero_suivi || colis.id}
                            </TableCell>
                            <TableCell className="text-xs">
                              {colis.client_nom || colis.client_id}
                            </TableCell>
                            <TableCell className="text-xs truncate max-w-xs">
                              {colis.adresse_livraison}
                            </TableCell>
                            <TableCell className="text-xs">
                              {colis.telephone_destinataire}
                            </TableCell>
                            <TableCell className="text-xs">
                              {colis.prix ? `${colis.prix} DZD` : '-'}
                            </TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="outline" className="text-xs">
                                {colis.statut || 'nouveau'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {previewData.length > 10 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    +{previewData.length - 10} autres colis...
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Importation de {previewData.length} colis en cours...
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setPreviewData([]);
                  setErrors([]);
                }}
              >
                Retour
              </Button>
              <Button
                onClick={handleImport}
                disabled={previewData.length === 0}
              >
                Importer {previewData.length} colis
              </Button>
            </>
          )}

          {step === 'importing' && (
            <Button disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importation...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ImportSuccessModal
      open={showSuccessModal}
      onOpenChange={setShowSuccessModal}
      importedData={importedData}
      successCount={successCount}
    />
    </>
  );
}
