import React, { useState, useRef, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { api, supabase } from '@/lib/supabase';
import { Entreprise } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { ImportSuccessModal } from './ImportSuccessModal';
import './ImportColisModal.css';

interface ImportColisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

interface ExcelRow {
  'CODE SUIVI'?: string;
  'DESTINATAIRE'?: string;
  'TELEPHONE'?: string;
  'ADRESSE'?: string;
  'PRIX'?: number | string;
  'VILLE'?: string;
  'COMMENTAIRE'?: string;
  [key: string]: any;
}

interface PreviewColis {
  code_suivi: string;
  destinataire: string;
  telephone: string;
  adresse: string;
  prix: number;
  ville: string;
  commentaire: string;
}

type StepType = 'upload' | 'preview' | 'select-entreprise' | 'importing' | 'success';

export function ImportColisModal({ open, onOpenChange, onImportSuccess }: ImportColisModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<StepType>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewColis[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [totalImported, setTotalImported] = useState(0);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState<string>('');
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [filterErrors, setFilterErrors] = useState<'all' | 'valid' | 'errors'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Fetch entreprises
  useEffect(() => {
    const fetchEntreprises = async () => {
      try {
        const { data, error } = await api.getEntreprises();
        if (error) throw error;
        setEntreprises(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Erreur lors du chargement des entreprises:', error);
        setEntreprises([]);
      }
    };
    fetchEntreprises();
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep('upload');
      setFile(null);
      setPreviewData([]);
      setErrors([]);
      setImporting(false);
      setShowPreview(true);
      setSelectedEntrepriseId('');
      setFilterErrors('all');
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

  const readExcelFile = async (file: File): Promise<ExcelRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          resolve(jsonData as ExcelRow[]);
        } catch (error) {
          reject(new Error('Impossible de lire le fichier Excel'));
        }
      };

      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsBinaryString(file);
    });
  };

  const validateColisData = (data: ExcelRow[]): { validRows: PreviewColis[], validationErrors: string[] } => {
    const validRows: PreviewColis[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      const rowNum = index + 2;
      const rowErrors: string[] = [];

      // Check required fields
      if (!row['CODE SUIVI']) {
        rowErrors.push(`Ligne ${rowNum}: CODE SUIVI manquant`);
      }

      if (!row['DESTINATAIRE']) {
        rowErrors.push(`Ligne ${rowNum}: DESTINATAIRE manquant`);
      }

      if (!row['ADRESSE']) {
        rowErrors.push(`Ligne ${rowNum}: ADRESSE manquante`);
      }

      if (!row['PRIX']) {
        rowErrors.push(`Ligne ${rowNum}: PRIX manquant`);
      }

      // Validate prix is a number
      if (row['PRIX'] && isNaN(Number(row['PRIX']))) {
        rowErrors.push(`Ligne ${rowNum}: PRIX invalide`);
      }

      if (rowErrors.length === 0) {
        validRows.push({
          code_suivi: String(row['CODE SUIVI']).trim(),
          destinataire: String(row['DESTINATAIRE']).trim(),
          telephone: row['TELEPHONE'] ? String(row['TELEPHONE']).trim() : '',
          adresse: String(row['ADRESSE']).trim(),
          prix: Number(row['PRIX']),
          ville: row['VILLE'] ? String(row['VILLE']).trim() : '',
          commentaire: row['COMMENTAIRE'] ? String(row['COMMENTAIRE']).trim() : '',
        });
      } else {
        errors.push(...rowErrors);
      }
    });

    return { validRows, validationErrors: errors };
  };

  const handleImport = async () => {
    if (!selectedEntrepriseId) {
      toast.error('Veuillez sélectionner une entreprise');
      return;
    }

    if (previewData.length === 0) {
      toast.error('Aucun colis à importer');
      return;
    }

    setImporting(true);
    setStep('importing');

    try {
      let successfulImports = 0;

      for (const colisData of previewData) {
        try {
          // Check if client already exists with same name
          let clientId: string;
          const { data: existingClients, error: searchError } = await supabase
            .from('clients')
            .select('id, nom, telephone')
            .eq('nom', colisData.destinataire);
          
          if (existingClients && existingClients.length > 0) {
            // Use existing client
            clientId = existingClients[0].id;
          } else {
            // Create new client only if it doesn't exist
            clientId = crypto.randomUUID();
            const { data: clientResult, error: clientError } = await api.createClient({
              id: clientId,
              nom: colisData.destinataire,
              telephone: colisData.telephone,
              adresse: colisData.adresse,
              ville: colisData.ville,
            });

            if (clientError || !clientResult) {
              throw new Error(`Impossible de créer le client: ${colisData.destinataire} - ${clientError?.message || 'Erreur inconnue'}`);
            }
          }

          // Generate UUID for colis
          const colisId = crypto.randomUUID();

          // Create colis with generated ID
          const { data: colisResult, error: colisError } = await api.createColis({
            id: colisId,
            client_id: clientId,
            entreprise_id: selectedEntrepriseId,
            statut: 'Nouveau Colis',
            date_creation: new Date().toISOString(),
            prix: colisData.prix,
            frais: 0,
            notes: `Code suivi: ${colisData.code_suivi}${colisData.commentaire ? ` - ${colisData.commentaire}` : ''}`,
          });

          if (colisError) {
            throw new Error(`Impossible de créer le colis: ${colisError.message}`);
          }

          // Create historique_colis entry for the new colis
          const historiqueId = crypto.randomUUID();
          const { error: historiqueError } = await supabase
            .from('historique_colis')
            .insert({
              id: historiqueId,
              colis_id: colisId,
              date: new Date().toISOString(),
              statut: 'Nouveau Colis',
              utilisateur: user?.id,
              informations: 'creation du colis',
            });

          if (historiqueError) {
            console.error(`Erreur lors de la création de l'historique du colis ${colisData.code_suivi}:`, historiqueError);
          }

          successfulImports++;
        } catch (error: any) {
          console.error(`Erreur lors de l'import du colis ${colisData.code_suivi}:`, error);
          toast.error(`Erreur: ${colisData.code_suivi} - ${error.message}`);
        }
      }

      setSuccessCount(successfulImports);
      setTotalImported(previewData.length);
      setShowSuccessModal(true);
      setImporting(false);

      toast.success(`${successfulImports}/${previewData.length} colis importés avec succès`);

      // Reset and close
      handleOpenChange(false);
      onImportSuccess();
    } catch (error: any) {
      setImporting(false);
      toast.error('Erreur lors de l\'importation');
      console.error(error);
    }
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
              {step === 'preview' && 'Vérifiez les données'}
              {step === 'select-entreprise' && 'Sélectionnez une entreprise pour les colis'}
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
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>CODE SUIVI</li>
                  <li>DESTINATAIRE</li>
                  <li>ADRESSE</li>
                  <li>PRIX</li>
                </ul>
                <p className="font-medium mt-3 mb-2">Colonnes optionnelles:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>TELEPHONE</li>
                  <li>VILLE</li>
                  <li>COMMENTAIRE</li>
                </ul>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-4 min-w-0">
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

              {/* Filter Select */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Affichage:
                </label>
                <Select value={filterErrors} onValueChange={(value: any) => setFilterErrors(value)}>
                  <SelectTrigger className="w-48 bg-white dark:bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800">
                    <SelectItem value="all">Tous les éléments</SelectItem>
                    <SelectItem value="valid">Valides uniquement</SelectItem>
                    <SelectItem value="errors">Erreurs uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Errors Section */}
              {(filterErrors === 'all' || filterErrors === 'errors') && errors.length > 0 && (
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

              {/* Valid Colis Preview */}
              {(filterErrors === 'all' || filterErrors === 'valid') && previewData.length > 0 && (
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
                    <div className="border rounded-lg overflow-x-auto w-full" ref={tableContainerRef}>
                      <Table className="min-w-max">
                        <TableHeader className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
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
                              <TableCell className="text-xs font-mono">{colis.code_suivi}</TableCell>
                              <TableCell className="text-xs">{colis.destinataire}</TableCell>
                              <TableCell className="text-xs max-w-xs">{colis.adresse}</TableCell>
                              <TableCell className="text-xs">{colis.telephone || '-'}</TableCell>
                              <TableCell className="text-xs">{colis.prix ? `${colis.prix} DH` : '-'}</TableCell>
                              <TableCell className="text-xs">
                                <Badge variant="outline" className="text-xs">Nouveau Colis</Badge>
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

          {/* Select Entreprise Step */}
          {step === 'select-entreprise' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm font-medium mb-4">Sélectionnez une entreprise pour tous les colis ({previewData.length}):</p>
                <Select value={selectedEntrepriseId} onValueChange={setSelectedEntrepriseId}>
                  <SelectTrigger className="w-full bg-white dark:bg-gray-800">
                    <SelectValue placeholder="Choisir une entreprise..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800">
                    {entreprises.map((ent) => (
                      <SelectItem key={ent.id} value={ent.id}>
                        {ent.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEntrepriseId && (
                <div className="space-y-2 min-w-0">
                  <h3 className="font-medium text-xs sm:text-sm">Aperçu des colis à importer ({previewData.length})</h3>
                  <div className="border rounded-lg overflow-x-auto w-full" ref={tableContainerRef}>
                    <Table className="min-w-max">
                      <TableHeader className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
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
                            <TableCell className="text-xs font-mono">{colis.code_suivi}</TableCell>
                            <TableCell className="text-xs">{colis.destinataire}</TableCell>
                            <TableCell className="text-xs max-w-xs">{colis.adresse}</TableCell>
                            <TableCell className="text-xs">{colis.telephone || '-'}</TableCell>
                            <TableCell className="text-xs">{colis.prix ? `${colis.prix} DH` : '-'}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="outline" className="text-xs">Nouveau Colis</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Retour
                </Button>
                {errors.length === 0 && (
                  <Button onClick={() => setStep('select-entreprise')} disabled={previewData.length === 0}>
                    Continuer ({previewData.length} colis)
                  </Button>
                )}
              </>
            )}

            {step === 'select-entreprise' && (
              <>
                <Button variant="outline" onClick={() => setStep('preview')}>
                  Retour
                </Button>
                <Button onClick={handleImport} disabled={!selectedEntrepriseId || previewData.length === 0}>
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
        importedData={previewData.map(p => ({
          numero_suivi: p.code_suivi,
          client_nom: p.destinataire,
          prix: p.prix,
          statut: 'Nouveau Colis'
        }))}
        successCount={successCount}
      />
    </>
  );
}
