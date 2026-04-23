import { createElement } from 'react';
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
  Svg,
  Path,
  G,
  Rect,
  Style,
} from '@react-pdf/renderer';
// Polyfill Buffer for @react-pdf/renderer in browser environments
import { Buffer as NodeBuffer } from 'buffer';
if (typeof globalThis !== 'undefined' && !globalThis.Buffer) {
  globalThis.Buffer = NodeBuffer;
// Use built-in Helvetica font for reliability (supports basic Latin characters)
// For proper Arabic support, consider self-hosting Arabic fonts or using a different approach
}
import { Bon, Colis } from '@/types';
import * as XLSX from 'xlsx';

Font.register({
  family: 'NotoArabic',
  fonts: [
    {
      src: '/fonts/NotoSansArabic-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: '/fonts/NotoSansArabic-Bold.ttf',
      fontWeight: 'bold',
    },
  ],
});

const defaultFont = 'Helvetica';
const arabicFont = 'NotoArabic';

interface CompanySettings {
  id?: string;
  nom?: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  email?: string;
}

type PreparedColis = {
  reference: string;
  client: string;
  entreprise: string;
  adresse: string;
  prix: number;
  frais: number;
  statut: string;
};

const h = createElement;

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 24,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  compactPage: {
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 18,
    fontSize: 9,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  logoContainer: {
    width: 56,
    height: 56,
    marginRight: 8,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoGridCompact: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  spacer: {
    width: 12,
    height: 8,
  },
  infoCard: {
    flexGrow: 1,
    flexBasis: 0,
    backgroundColor: '#f8fafc',
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
    borderRadius: 6,
    padding: 12,
  },
  infoCardAlt: {
    backgroundColor: '#f0f9ff',
    borderLeftColor: '#0284c7',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  cardTitleAlt: {
    color: '#0284c7',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#475569',
    marginRight: 4,
  },
  infoValue: {
    color: '#1e293b',
    flexShrink: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 10,
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    minHeight: 30,
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  text: {
    fontSize: 8.5,
  },
  textBold: {
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  textHeader: {
    color: '#ffffff',
  },
  moneyText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#059669',
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    minHeight: 30,
    backgroundColor: '#f1f5f9',
    borderTopWidth: 2,
    borderTopColor: '#2563eb',
  },
  totalGeneralRow: {
    flexDirection: 'row',
    minHeight: 30,
    backgroundColor: '#e2e8f0',
    borderTopWidth: 1,
    borderTopColor: '#2563eb',
  },
  compactItemCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  compactItemHeader: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  compactItemHeaderText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  compactItemBody: {
    padding: 8,
  },
  compactRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  compactPrices: {
    marginTop: 6,
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
    padding: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notesBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  footer: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 3,
  },
});

const columnStyles = {
  reference: { flexGrow: 1, flexBasis: 1 },
  client: { flexGrow: 1, flexBasis: 1 },
  entreprise: { flexGrow: 1, flexBasis: 1 },
  adresse: { flexGrow: 1.5, flexBasis: 1.5 },
  frais: { flexGrow: 0.8, flexBasis: 0.8 },
  prix: { flexGrow: 0.8, flexBasis: 0.8 },
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusText = (statut?: string) => {
  const normalized = (statut || '').toLowerCase();

  switch (normalized) {
    case 'en cours':
      return 'En cours';
    case 'complété':
    case 'complete':
      return 'Complété';
    case 'annulé':
    case 'annule':
      return 'Annulé';
    default:
      return statut || '—';
  }
};

const getBonTypeLabel = (type: Bon['type']) =>
  type.charAt(0).toUpperCase() + type.slice(1);

const money = (value: number) => `${value.toFixed(2)} DH`;

const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

const getFont = (text: string) => {
  if (isArabic(text)) return arabicFont;
  return defaultFont;
};

const getPreparedColis = (colisData?: Colis[]): PreparedColis[] => {
  if (colisData && colisData.length > 0) {
    return colisData.map((colis, index) => ({
      reference: colis.numero_colis || colis.id || `idx-${index}`,
      client:
        colis.client?.nom ||
        [colis.client_nom, colis.client_prenom].filter(Boolean).join(' ').trim() ||
        '—',
      entreprise: colis.entreprise?.nom || '—',
      adresse:
        colis.adresse_livraison || colis.client?.adresse || colis.commentaires || '—',
      prix: Number(colis.prix || 0),
      frais: Number(colis.frais || 0),
      statut: colis.statut || 'En cours',
    }));
  }

  return [];
};

const createInfoRow = (
  label: string,
  value?: string | number | null,
  uniqueKey?: string,
) => {
  if (value === undefined || value === null || value === '') return null;

  const textValue = String(value);

  return h(
    View,
    { style: styles.infoRow, key: uniqueKey || label },
    h(
      Text,
      {
        key: `${uniqueKey || label}-label`,
        style: {
          ...styles.infoLabel,
          fontFamily: getFont(label),
        },
      },
      label,
    ),
    h(
      Text,
      {
        key: `${uniqueKey || label}-value`,
        style: {
          ...styles.infoValue,
          fontFamily: getFont(textValue),
          direction: isArabic(textValue) ? 'rtl' : 'ltr',
          textAlign: isArabic(textValue) ? 'right' : 'left',
        },
      },
      textValue,
    ),
  );
};

const createTableCell = (
  key: string,
  content: string,
  style: Record<string, unknown>,
  textStyle: any,
  removeRightBorder = false,
) =>
  h(
    View,
    {
      key,
      style: [
        styles.tableCell,
        style,
        removeRightBorder ? { borderRightWidth: 0 } : null,
      ],
    },
    h(Text, {
      key: `${key}-text`,
      style: {
        ...textStyle,
        fontFamily: getFont(content),
        direction: isArabic(content) ? 'rtl' : 'ltr',
        textAlign: isArabic(content) ? 'right' : 'left',
      },
    }, content),
  );

const BonPdfDocument = ({
  bon,
  colis,
  companySettings,
  compact = false,
}: {
  bon: Bon;
  colis?: Colis[];
  companySettings?: CompanySettings;
  compact?: boolean;
}) => {
  const preparedColis = getPreparedColis(colis);
  const totalPrix = preparedColis.reduce((sum, item) => sum + item.prix, 0);
  const totalFrais = preparedColis.reduce((sum, item) => sum + item.frais, 0);
  const totalGeneral = totalPrix + totalFrais;
  const bonUser = bon.user;
  console.log('USER AFTER ASSIGN:', bonUser);
  const hasBonUser = Boolean(
    bonUser && (bonUser.nom || bonUser.prenom || bonUser.email || bonUser.telephone),
  );
  const showLivreurCard = bon.source_type === 'livreur' || hasBonUser;

  const leftCard = h(
    View,
    { style: styles.infoCard, key: 'info-card-1' },
    [
      h(Text, { style: styles.cardTitle, key: 'title' }, 'Informations générales'),
      createInfoRow('ID Bon:', bon.id),
      createInfoRow('Type:', getBonTypeLabel(bon.type)),
      createInfoRow('Statut:', getStatusText(bon.statut)),
      createInfoRow('Date de création:', formatDate(bon.date_creation)),
      createInfoRow('Nombre de colis:', bon.nb_colis ?? preparedColis.length),
    ].filter((item): item is NonNullable<typeof item> => item !== null),
  );

  const rightCard = h(
    View,
    {
      style: [styles.infoCard, !showLivreurCard ? styles.infoCardAlt : null],
      key: 'info-card-2',
    },
    [
      h(
        Text,
        {
          style: [styles.cardTitle, !showLivreurCard ? styles.cardTitleAlt : null],
          key: 'title',
        },
        showLivreurCard ? 'Livreur assigné' : 'Informations Entreprise',
      ),
      ...(showLivreurCard
        ? [
            createInfoRow(
              'Nom:',
              [bonUser?.nom, bonUser?.prenom].filter(Boolean).join(' ').trim() || '—',
            ),
            createInfoRow('Email:', bonUser?.email),
            createInfoRow('Téléphone:', bonUser?.telephone),
            createInfoRow('Véhicule:', bonUser?.vehicule),
            createInfoRow('Zone:', bonUser?.zone),
            createInfoRow('Ville:', bonUser?.ville || 'TEST'),
          ]
        : [
            createInfoRow('Entreprise:', companySettings?.nom),
            createInfoRow(
              'Adresse:',
              [companySettings?.adresse, companySettings?.ville]
                .filter(Boolean)
                .join(', '),
            ),
            createInfoRow('Téléphone:', companySettings?.telephone),
            createInfoRow('Email:', companySettings?.email),
          ]),
    ].filter((item): item is NonNullable<typeof item> => item !== null),
  );

  const desktopTable = h(
    View,
    { style: styles.tableWrapper, key: 'table' },
    [
      h(
        View,
        { style: styles.tableHeader, key: 'header' },
        [
          createTableCell(
            'h-reference',
            'Référence',
            columnStyles.reference,
            [styles.textBold, styles.textHeader],
          ),
          createTableCell(
            'h-client',
            'Client',
            columnStyles.client,
            [styles.textBold, styles.textHeader],
          ),
          createTableCell(
            'h-entreprise',
            'Entreprise',
            columnStyles.entreprise,
            [styles.textBold, styles.textHeader],
          ),
          createTableCell(
            'h-adresse',
            'Adresse',
            columnStyles.adresse,
            [styles.textBold, styles.textHeader],
          ),
          createTableCell(
            'h-frais',
            'Frais',
            columnStyles.frais,
            [styles.textBold, styles.textHeader],
          ),
          createTableCell(
            'h-prix',
            'Prix',
            columnStyles.prix,
            [styles.textBold, styles.textHeader],
            true,
          ),
        ],
      ),
      preparedColis.length === 0
        ? h(
            View,
            {
              key: 'empty-row',
              style: styles.tableRow,
            },
            [
              createTableCell(
                'empty-cell',
                'Aucun colis trouvé',
                { flexGrow: 6, flexBasis: 6 },
                [styles.textBold],
                true
              ),
            ]
          )
        : preparedColis.map((item, index) =>
            h(
              View,
              {
                key: `row-${index}`,
                style: [styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : null],
                wrap: false,
              },
              [
                createTableCell(`cell-ref-${index}`, item.reference, columnStyles.reference, styles.textBold),
                createTableCell(`cell-client-${index}`, item.client, columnStyles.client, styles.text),
                createTableCell(`cell-ent-${index}`, item.entreprise, columnStyles.entreprise, styles.text),
                createTableCell(`cell-addr-${index}`, item.adresse, columnStyles.adresse, styles.text),
                createTableCell(`cell-frais-${index}`, money(item.frais), columnStyles.frais, styles.moneyText),
                createTableCell(`cell-prix-${index}`, money(item.prix), columnStyles.prix, styles.moneyText, true),
              ],
            )
          ),
      preparedColis.length > 0 &&
        h(
          View,
          { style: styles.totalRow, key: 'total-row', wrap: false },
          [
            createTableCell(
              'total-label',
              'TOTAL',
              { flexGrow: 4.5, flexBasis: 4.5 },
              styles.textBold,
              true,
            ),
            createTableCell('total-frais', money(totalFrais), columnStyles.frais, styles.textBold),
            createTableCell('total-prix', money(totalPrix), columnStyles.prix, styles.textBold, true),
          ],
        ),

      preparedColis.length > 0 &&
        h(
          View,
          { style: styles.totalGeneralRow, key: 'general-row', wrap: false },
          [
            createTableCell(
              'general-label',
              'TOTAL GÉNÉRAL',
              { flexGrow: 4.5, flexBasis: 4.5 },
              styles.textBold,
              true,
            ),
            createTableCell(
              'general-value',
              money(totalGeneral),
              { flexGrow: 1.6, flexBasis: 1.6 },
              styles.textBold,
              true,
            ),
          ],
        ),
          ],
        );

  const compactCards = preparedColis.map((item, index) =>
    h(
      View,
      {
        key: `compact-${item.reference}-${index}`,
        style: styles.compactItemCard,
        wrap: false,
      },
      [
        h(
          View,
          { style: styles.compactItemHeader, key: `header-${item.reference}-${index}` },
          h(Text, { key: `header-text-${index}`, style: styles.compactItemHeaderText }, `Réf: ${item.reference}`),
        ),
        h(
          View,
          { style: styles.compactItemBody, key: `body-${item.reference}-${index}` },
          [
            h(View, { style: styles.compactRow, key: `client-${item.reference}-${index}` }, [
              h(Text, { key: `client-label-${index}`, style: styles.infoLabel }, 'Client:'),
              h(Text, { key: `client-value-${index}`, style: styles.infoValue }, item.client),
            ]),
            h(View, { style: styles.compactRow, key: `entreprise-${item.reference}-${index}` }, [
              h(Text, { key: `entreprise-label-${index}`, style: styles.infoLabel }, 'Entreprise:'),
              h(Text, { key: `entreprise-value-${index}`, style: styles.infoValue }, item.entreprise),
            ]),
            h(View, { style: styles.compactRow, key: `adresse-${item.reference}-${index}` }, [
              h(Text, { key: `adresse-label-${index}`, style: styles.infoLabel }, 'Adresse:'),
              h(Text, { key: `adresse-value-${index}`, style: styles.infoValue }, item.adresse),
            ]),
            h(View, { style: styles.compactRow, key: `statut-${item.reference}-${index}` }, [
              h(Text, { key: `statut-label-${index}`, style: styles.infoLabel }, 'Statut:'),
              h(Text, { key: `statut-value-${index}`, style: styles.infoValue }, getStatusText(item.statut)),
            ]),
            h(
              View,
              { style: styles.compactPrices, key: `prices-${item.reference}-${index}` },
              [
                h(Text, { style: styles.moneyText, key: `prix-${item.reference}-${index}` }, `Prix: ${money(item.prix)}`),
                h(Text, { style: styles.moneyText, key: `frais-${item.reference}-${index}` }, `Frais: ${money(item.frais)}`),
              ],
            ),
          ],
        ),
      ],
    ),
  );

  return h(
    Document,
    {
      title: `Bon de ${bon.type} #${bon.id}`,
      author: 'LogiTrack',
      subject: 'Bon logistique',
      language: 'fr-FR',
    },
    h(
      Page,
      {
        size: 'A4',
        style: compact ? [styles.page, styles.compactPage] : styles.page,
        wrap: true,
      },
      [
        h(
          View,
          { style: styles.header, key: 'header' },
          [
            h(
              View,
              { style: styles.headerRow, key: 'header-row' },
              [
                h(
                  Svg,
                  { width: 56, height: 56, viewBox: '0 0 24 24', style: styles.logoContainer, key: 'logo-svg' },
                  h(
                    G,
                    { transform: 'translate(4, 4)' },
                    h(Path, {
                      d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      fill: 'none',
                    }),
                  ),
                ),
                h(
                  Text,
                  { style: styles.title, key: 'title' },
                  `BON DE ${getBonTypeLabel(bon.type).toUpperCase()}`,
                ),
              ],
            ),
            h(
              Text,
              { style: styles.subtitle, key: 'subtitle' },
              'LogiTrack - Système de gestion logistique',
            ),
          ],
        ),
        h(
          View,
          {
            style: compact ? styles.infoGridCompact : styles.infoGrid,
            key: 'info-grid',
          },
          [leftCard, h(View, { style: styles.spacer, key: 'spacer' }), rightCard],
        ),
        h(
          Text,
          { style: styles.sectionTitle, key: 'section-title' },
          `Liste des Colis (${preparedColis.length} colis)`,
        ),
        compact ? h(View, { key: 'compact-table' }, compactCards) : desktopTable,
        bon.notes
          ? h(
              View,
              { style: styles.notesBox, key: 'notes' },
              [
                h(Text, { style: styles.cardTitle, key: 'title' }, 'Notes'),
                h(Text, { style: styles.infoValue, key: 'value' }, bon.notes),
              ],
            )
          : null,
        compact
          ? h(
              View,
              { style: styles.notesBox, key: 'summary' },
              [
                h(Text, { style: styles.cardTitle, key: 'title' }, 'Résumé'),
                h(Text, { style: styles.infoValue, key: 'prix' }, `Total prix: ${money(totalPrix)}`),
                h(Text, { style: styles.infoValue, key: 'frais' }, `Total frais: ${money(totalFrais)}`),
                h(Text, { style: styles.infoValue, key: 'general' }, `Total général: ${money(totalGeneral)}`),
              ],
            )
          : null,
        h(
          View,
          { style: styles.footer, key: 'footer' },
          [
            h(
              Text,
              { style: styles.footerText, key: 'generated' },
              `Document généré le ${formatDate(new Date().toISOString())} par LogiTrack`,
            ),
            h(
              Text,
              { style: styles.footerText, key: 'totals' },
              `Total des colis: ${preparedColis.length} | Montant total: ${money(totalGeneral)}`,
            ),
          ],
        ),
      ],
    ),
  );
};

const buildPdfBlob = async (
  bon: Bon,
  colis?: Colis[],
  companySettings?: CompanySettings,
  compact = false,
) => {
  const element = h(BonPdfDocument, {
    bon,
    colis,
    companySettings,
    compact,
  });
  const result = await pdf(element).toBlob();
  return result;
};

const getPdfFilename = (bon: Bon, compact = false) => {
  const prefix = compact ? 'Bon_Mobile' : 'Bon';
  return `${prefix}_${getBonTypeLabel(bon.type)}_${bon.id}_${new Date()
    .toISOString()
    .split('T')[0]}.pdf`;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 1000);
};

const printBlob = async (blob: Blob) => {
  const blobUrl = URL.createObjectURL(blob);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;

  document.body.appendChild(iframe);

  return new Promise<void>((resolve, reject) => {
    iframe.onload = () => {
      try {
        const win = iframe.contentWindow;
        if (!win) return reject('No iframe window');

        // 🔥 KEY FIX: wait until PDF is REALLY ready
        const checkReady = () => {
          try {
            win.focus();
            win.print();
            resolve();
          } catch {
            setTimeout(checkReady, 300);
          }
        };

        setTimeout(checkReady, 500);
      } catch (err) {
        reject(err);
      }
    };

    iframe.onerror = (err) => reject(err);

    // cleanup
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      URL.revokeObjectURL(blobUrl);
    }, 5000);
  });
};

export const printBon = async (
  bon: Bon,
  colis?: Colis[],
  companySettings?: CompanySettings,
): Promise<void> => {
  try {
    const blob = await buildPdfBlob(bon, colis, companySettings, false);
    await printBlob(blob);
  } catch (error) {
    console.error('[PRINT] Error in printBon:', error);
    throw new Error('Erreur lors de l\\\'impression du PDF');
  }
};

export const downloadBonAsPDF = async (
  bon: Bon,
  colis?: Colis[],
  companySettings?: CompanySettings,
): Promise<void> => {
  try {
    const blob = await buildPdfBlob(bon, colis, companySettings, false);
    downloadBlob(blob, getPdfFilename(bon, false));
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Erreur lors de la génération du PDF');
  }
};

export const downloadMobileBonAsPDF = async (
  bon: Bon,
  colisData?: Colis[],
  companySettings?: CompanySettings,
): Promise<void> => {
  try {
    const blob = await buildPdfBlob(bon, colisData, companySettings, true);
    downloadBlob(blob, getPdfFilename(bon, true));
  } catch (error) {
    console.error('Error generating mobile PDF:', error);
    throw new Error('Erreur lors de la génération du PDF mobile');
  }
};

export const downloadBonAsExcel = async (
  bon: Bon,
  colisData?: Colis[],
  companySettings?: CompanySettings,
): Promise<void> => {
  try {
    const sampleColis = colisData ?? [];

    const totalPrix = sampleColis.reduce((sum, item) => sum + Number(item.prix || 0), 0);
    const totalFrais = sampleColis.reduce((sum, item) => sum + Number(item.frais || 0), 0);
    const totalGeneral = totalPrix + totalFrais;

    const workbook = XLSX.utils.book_new();
    const sheetData: (string | number)[][] = [];

    sheetData.push(['BON DE DISTRIBUTION']);
    sheetData.push(['']);
    sheetData.push(['INFORMATIONS GÉNÉRALES']);
    sheetData.push(['ID Bon:', bon.id, '', '', 'Type:', getBonTypeLabel(bon.type)]);
    sheetData.push(['Date de création:', formatDate(bon.date_creation), '', '', 'Statut:', bon.statut]);
    sheetData.push([
      'Livreur / Source:',
      bon.user ? `${bon.user.nom} ${bon.user.prenom || ''}`.trim() : companySettings?.nom || 'Non assigné',
      '',
      '',
      'Nombre de colis:',
      bon.nb_colis || sampleColis.length,
    ]);
    sheetData.push([
      'Email:',
      bon.user?.email || companySettings?.email || 'Non assigné',
      '',
      '',
      'Téléphone:',
      bon.user?.telephone || companySettings?.telephone || 'Non assigné',
    ]);
    sheetData.push(['Notes:', bon.notes || 'Aucune note']);
    sheetData.push(['']);
    sheetData.push(['LISTE DES COLIS']);
    sheetData.push([
      'Référence',
      'Client',
      'Téléphone',
      'Adresse',
      'Entreprise',
      'Frais (DH)',
      'Prix (DH)',
      'Total (DH)',
      'Statut',
    ]);

    sampleColis.forEach((item) => {
      sheetData.push([
        item.numero_colis || item.id || '',
        item.client?.nom || [item.client_nom, item.client_prenom].filter(Boolean).join(' ').trim(),
        item.client?.telephone || item.client_telephone || '',
        item.adresse_livraison || item.client?.adresse || '',
        item.entreprise?.nom || '',
        Number(item.frais || 0).toFixed(2),
        Number(item.prix || 0).toFixed(2),
        (Number(item.prix || 0) + Number(item.frais || 0)).toFixed(2),
        item.statut || '',
      ]);
    });

    sheetData.push(['']);
    sheetData.push(['RÉSUMÉ']);
    sheetData.push(['Total Frais:', `${totalFrais.toFixed(2)} DH`]);
    sheetData.push(['Total Prix:', `${totalPrix.toFixed(2)} DH`]);
    sheetData.push(['TOTAL GÉNÉRAL:', `${totalGeneral.toFixed(2)} DH`]);
    sheetData.push(['Nombre de colis:', sampleColis.length]);

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    worksheet['!cols'] = [
      { width: 18 },
      { width: 24 },
      { width: 18 },
      { width: 36 },
      { width: 22 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 16 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bon');
    XLSX.writeFile(
      workbook,
      `Bon_${getBonTypeLabel(bon.type)}_${bon.id}_${new Date().toISOString().split('T')[0]}.xlsx`,
    );
  } catch (error) {
    console.error('Error generating Excel file:', error);
    throw new Error('Erreur lors de la génération du fichier Excel');
  }
};
