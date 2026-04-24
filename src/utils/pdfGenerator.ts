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

  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  cardTitleAlt: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#475569',
  },
  infoValue: {
    fontSize: 9.5,
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563eb',
    marginLeft: 6,
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
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
    fontSize: 9,
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
    backgroundColor: '#cbdef1',
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

  footerText: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 3,
  },
  

  //new styles :

  logoBox: {
    width: 48,
    height: 48,
    backgroundColor: '#2F5BD3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    flexShrink: 1,
  },

  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },

  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 12,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
  },

  headerTop: {
    flexDirection: 'row',   // ✅ MUST be row
    alignItems: 'center',
    width: '100%', // ✅ VERY IMPORTANT
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,     // ✅ take remaining space
    flexShrink: 1,
    minWidth: 0,   
  },

  headerRight: {
    width: 180,
    flexShrink: 0,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#cbd5f5',
  },

  metaLabel: {
    fontSize: 8,
    color: '#64748b',
  },

  metaValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },

  headerDivider: {
    marginTop: 10,
    height: 2,
    backgroundColor: '#2563eb',
  },

  infoCard: {
    flexGrow: 1,
    flexBasis: 0,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 10,
  },


  infoCardAlt: {
    backgroundColor: '#f0f9ff',
    borderLeftColor: '#0284c7',
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2F5BD3',
    minHeight: 32,
  },

  tableRow: {
    flexDirection: 'row',
    minHeight: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  totalGeneralRow: {
    flexDirection: 'row',
    minHeight: 32,
    backgroundColor: '#2F5BD3',
  },

  textBoldWhite: {
    fontWeight: 'bold',
    color: '#ffffff',
  },

  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#2563eb',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryTotal: {
    marginTop: 8,
    backgroundColor: '#e0edff',
    padding: 6,
    borderRadius: 6,
    fontWeight: 'bold',
    color: '#2563eb',
  },

  notesSummaryRow: {
    flexDirection: 'row',
    marginTop: 12,
  },

  notesBox: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 14,
    marginRight: 10,
  },

  summaryBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  summaryLabel: {
    fontSize: 9.5,
    color: '#475569',
  },

  summaryValue: {
    fontSize: 9.5,
    color: '#0f172a',
  },

  summaryHighlight: {
    marginTop: 8,
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  summaryTotalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1d4ed8',
  },

  summaryTotalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1d4ed8',
  },

  textCenter:{
    textAlign: 'center',
  },

  textBlue:{
    color: '#2563eb' 
  },
});

const columnStyles = {
  reference: { flexGrow: 1.2, flexBasis: 1.2 },
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
    {
      key: uniqueKey || label,
      style: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
      },
    },
    [
      // BULLET
      h(View, {
        key: 'bullet',
        style: {
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: '#2563eb',
          marginRight: 6,
        },
      }),

      // LABEL (FIXED WIDTH)
      h(
        Text,
        {
          key: 'label',
          style: {
            ...styles.infoLabel,
            width: 110, // 🔥 KEY: align all values
            fontFamily: getFont(label),
          },
        },
        label,
      ),

      // VALUE (aligned column)
      h(
        Text,
        {
          key: 'value',
          style: {
            ...styles.infoValue,
            fontFamily: getFont(textValue),
            flex: 1,
          },
        },
        textValue,
      ),
    ],
  );
};


const createTableCell = (
  key: string,
  content: string,
  style: Record<string, unknown>,
  textStyle: any,
  removeRightBorder = false,
  align?: 'left' | 'center' | 'right',
) => {
  const isAr = isArabic(content);

  const finalAlign = align ?? (isAr ? 'right' : 'left');

  return h(
    View,
    {
      key,
      style: [
        styles.tableCell,
        style,
        removeRightBorder ? { borderRightWidth: 0 } : null,
      ],
    },
    [
      h(
        View, // ✅ WRAPPER that controls alignment (THIS is the fix)
        {
          key: `${key}-wrapper`,
          style: {
            width: '100%',
            alignItems:
              finalAlign === 'center'
                ? 'center'
                : finalAlign === 'right'
                ? 'flex-end'
                : 'flex-start',
          },
        },
        [
          h(
            Text,
            {
              key: `${key}-text`,
              style: [
                textStyle,
                {
                  fontFamily: getFont(content),
                  ...(isAr
                  ? {
                      width: '100%',
                      textAlign: 'center',
                    }
                  : {
                      textAlign: finalAlign,
                    }),
                },
              ],
            },
            content
          ),
        ]
      ),
    ]
  );
};

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
  const hasBonUser = Boolean(
    bonUser && (bonUser.nom || bonUser.prenom || bonUser.email || bonUser.telephone),
  );
  const showLivreurCard = bon.source_type !== 'admin';

  const leftCard = h(
  View,
  { style: styles.infoCard, key: 'info-card-1' },
  [
    // HEADER
    h(
      View,
      { key: 'left-header', style: styles.cardHeaderRow },
      [
        h(
          View,
          { key: 'left-icon', style: styles.iconBox },
          h(
            Svg,
            { width: 12, height: 12, viewBox: '0 0 24 24' },
            h(Path, {
              d: 'M12 2a10 10 0 100 20 10 10 0 000-20zm1 14h-2v-6h2zm0-8h-2V6h2z',
              fill: '#ffffff',
            })
          )
        ),
        h(Text, { key: 'left-title', style: styles.cardTitle }, 'INFORMATIONS GÉNÉRALES'),
      ]
    ),

    h(View, { key: 'left-divider', style: styles.cardDivider }),

    // CONTENT
    createInfoRow('ID Bon:', bon.id, 'id'),
    createInfoRow('Type:', getBonTypeLabel(bon.type), 'type'),
    createInfoRow('Statut:', getStatusText(bon.statut), 'statut'),
    createInfoRow('Date de création:', formatDate(bon.date_creation), 'date'),
    createInfoRow('Nombre de colis:', bon.nb_colis ?? preparedColis.length, 'colis'),
  ].filter(Boolean),
);


const rightCard = h(
  View,
  {
    style: [styles.infoCard, styles.infoCardAlt],
    key: 'info-card-2',
  },
  [
    // HEADER
    h(
      View,
      { key: 'right-header', style: styles.cardHeaderRow },
      [
        h(
          View,
          { key: 'right-icon', style: styles.iconBox },
          h(
            Svg,
            { width: 12, height: 12, viewBox: '0 0 24 24' },
            h(Path, {
              d: showLivreurCard
                ? 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' // user icon
                : 'M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6', // entreprise (building) icon
              stroke: '#ffffff',
              strokeWidth: 1.8,
              fill: 'none',
            })
          ),
        ),

        h(
          Text,
          { key: 'right-title', style: styles.cardTitleAlt },
          showLivreurCard
            ? 'LIVREUR ASSIGNÉ'
            : 'INFORMATIONS ENTREPRISE'
        ),
      ]
    ),

    h(View, { key: 'right-divider', style: styles.cardDivider }),

    // CONTENT
    ...(showLivreurCard
      ? [
          createInfoRow(
            'Nom:',
            [bonUser?.nom, bonUser?.prenom].filter(Boolean).join(' ').trim() || '—',
            'nom'
          ),
          createInfoRow('Email:', bonUser?.email, 'email'),
          createInfoRow('Téléphone:', bonUser?.telephone, 'tel'),
          createInfoRow('Véhicule:', bonUser?.vehicule, 'vehicule'),
          createInfoRow('Zone:', bonUser?.zone, 'zone'),
          createInfoRow('Ville:', bonUser?.ville || '—', 'ville'),
        ]
      : [
          createInfoRow('Entreprise:', companySettings?.nom, 'ent'),
          createInfoRow(
            'Adresse:',
            [companySettings?.adresse, companySettings?.ville]
              .filter(Boolean)
              .join(', '),
            'adresse'
          ),
          createInfoRow('Téléphone:', companySettings?.telephone, 'tel2'),
          createInfoRow('Email:', companySettings?.email, 'email2'),
        ]),
  ].filter(Boolean),
);
  const desktopTable = h(
    View,
    { style: styles.tableWrapper, key: 'table' },
    [
      h(
        View,
        { key: 'table-header-row', style: styles.tableHeader },
        [
          createTableCell(
            'h-reference',
            'Référence',
            columnStyles.reference,
            [styles.textBold, { whiteSpace: 'nowrap' }, styles.textHeader],
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
            [styles.textBold, styles.textHeader, styles.textCenter],
            false,
            'center' 
          ),
          createTableCell(
            'h-prix',
            'Prix',
            columnStyles.prix,
            [styles.textBold, styles.textHeader, styles.textCenter],
            true,
            'center' 
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
                createTableCell(`cell-frais-${index}`, money(item.frais), columnStyles.frais, styles.moneyText,false,'center'),
                createTableCell(`cell-prix-${index}`, money(item.prix), columnStyles.prix, styles.moneyText, true,'center'),
              ],
            )
          ),
      preparedColis.length > 0 &&
        h(
          View,
          { key: 'total-row', style: styles.totalRow, wrap: false },
          [
            createTableCell(
              'total-label',
              'TOTAL',
              { flexGrow: 5.2, flexBasis: 5.2 },
              [styles.textBold, styles.textBlue],
              true,
            ),
            createTableCell('total-frais', money(totalFrais), columnStyles.frais, [styles.textBold, styles.textBlue],false,'center'),
            createTableCell('total-prix', money(totalPrix), columnStyles.prix, [styles.textBold, styles.textBlue], true, 'center'),
          ],
        ),

      preparedColis.length > 0 &&
        h(
          View,
          { key: 'general-row', style: styles.totalGeneralRow, wrap: false },
          [
            createTableCell(
              'general-label',
              'TOTAL GÉNÉRAL',
              { flexGrow: 7, flexBasis: 7 },
              styles.textBoldWhite,
              true,
            ),
            createTableCell(
              'general-value',
              money(totalGeneral),
              { flexGrow: 1.6, flexBasis: 1.6 },
              styles.textBoldWhite,
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
          { key: `compact-header-${index}`, style: styles.compactItemHeader },
          h(Text, { key: `header-text-${index}`, style: styles.compactItemHeaderText }, `Réf: ${item.reference}`),
        ),
        h(
          View,
          { key: `compact-body-${index}`, style: styles.compactItemBody },
          [
            h(View, { key: `compact-client-${index}`, style: styles.compactRow }, [
              h(Text, { key: `client-label-${index}`, style: styles.infoLabel }, 'Client:'),
              h(Text, { key: `client-value-${index}`, style: styles.infoValue }, item.client),
            ]),
            h(View, { key: `compact-entreprise-${index}`, style: styles.compactRow }, [
              h(Text, { key: `entreprise-label-${index}`, style: styles.infoLabel }, 'Entreprise:'),
              h(Text, { key: `entreprise-value-${index}`, style: styles.infoValue }, item.entreprise),
            ]),
            h(View, { key: `compact-adresse-${index}`, style: styles.compactRow }, [
              h(Text, { key: `adresse-label-${index}`, style: styles.infoLabel }, 'Adresse:'),
              h(Text, { key: `adresse-value-${index}`, style: styles.infoValue }, item.adresse),
            ]),
            h(View, { key: `compact-statut-${index}`, style: styles.compactRow }, [
              h(Text, { key: `statut-label-${index}`, style: styles.infoLabel }, 'Statut:'),
              h(Text, { key: `statut-value-${index}`, style: styles.infoValue }, getStatusText(item.statut)),
            ]),
            h(
              View,
              { key: `compact-prices-${index}`, style: styles.compactPrices },
              [
                h(Text, { key: `prix-${index}`, style: styles.moneyText }, `Prix: ${money(item.prix)}`),
                h(Text, { key: `frais-${index}`, style: styles.moneyText }, `Frais: ${money(item.frais)}`),
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
              { key: 'header-top', style: styles.headerTop },
              [
                // LEFT SIDE
                h(
                  View,
                  { key: 'header-left', style: styles.headerLeft },
                  [
                    h(
                      View,
                      { key: 'logo-box', style: styles.logoBox },
                      h(
                        Svg,
                        { width: 28, height: 28, viewBox: '0 0 24 24' },
                        h(Path, {
                          d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
                          stroke: '#ffffff',
                          strokeWidth: 1.6,
                          fill: 'none',
                        })
                      )
                    ),

                    h(
                      View,
                      {key: 'title-container', style: { flexShrink: 1 }},
                      [
                        h(
                          Text,
                          { key: 'title', style: styles.title },
                          `BON DE ${getBonTypeLabel(bon.type).toUpperCase()}`
                        ),
                        h(
                          Text,
                          { key: 'subtitle', style: styles.subtitle },
                          'LogiTrack - Système de gestion logistique'
                        ),
                      ]
                    )
                  ]
                ),

                // RIGHT SIDE
                h(
                  View,
                  { key: 'header-right', style: styles.headerRight },
                  [
                    h(Text, { key: 'meta-label-1', style: styles.metaLabel }, 'N° Bon'),
                    h(Text, { key: 'meta-value-1', style: styles.metaValue }, bon.id),

                    h(Text, { key: 'meta-label-2', style: styles.metaLabel }, 'Date de création'),
                    h(Text, { key: 'meta-value-2', style: styles.metaValue }, formatDate(bon.date_creation)),
                  ]
                )
              ]
            ),

            // BLUE LINE
            h(View, { key: 'header-divider', style: styles.headerDivider })
          ]
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
          View,
          { key: 'section-title-row', style: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 } },
          [
            h(
              View,
              { key: 'section-icon' },
              h(
                Svg,
                { width: 28, height: 28, viewBox: '0 0 24 24' },
                h(Path, {
                  d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
                  stroke: '#1d4ed8',
                  strokeWidth: 1.6,
                  fill: 'none',
                })
              )
            ),
            h( 
              Text,
              { key: 'section-title-text', style: styles.sectionTitle },
              `LISTE DES COLIS (${preparedColis.length} colis)`
            ),
          ]
        ),
        compact ? h(View, { key: 'compact-table' }, compactCards) : desktopTable,
        h(
          View,
          { style: styles.notesSummaryRow, key: 'notes-summary' },
          [
            ...(bon.notes
              ? [
                  h(
                    View,
                    { style: styles.notesBox, key: 'notes-card' },
                    [
                      // HEADER
                      h(
                        View,
                        { key: 'notes-header', style: styles.cardHeaderRow },
                        [
                          h(
                            View,
                            { key: 'notes-icon', style: styles.iconBox },
                            h(
                              Svg,
                              { width: 10, height: 10, viewBox: '0 0 24 24' },
                              h(Path, {
                                d: 'M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z',
                                stroke: '#ffffff',
                                strokeWidth: 1.5,
                                fill: 'none',
                              })
                            )
                          ),
                          h(Text, { key: 'notes-title', style: styles.cardTitle }, 'NOTES'),
                        ]
                      ),

                      h(View, { key: 'notes-divider', style: styles.cardDivider }),

                      // CONTENT
                      h(Text, { key: 'notes-content', style: styles.infoValue }, bon.notes),
                    ]
                  )
                ]
              : []),

            // SUMMARY CARD
            h(
              View,
              { style: styles.summaryBox, key: 'summary-card' },
              [
                // HEADER
                h(
                  View,
                  { key: 'summary-header', style: styles.cardHeaderRow },
                  [
                    h(
                      View,
                      { key: 'summary-icon', style: styles.iconBox },
                      h(
                        Svg,
                        { width: 10, height: 10, viewBox: '0 0 24 24' },
                        h(Path, {
                          d: 'M20 12v8H4V4h8m4 0v4m0-4l-8 8',
                          stroke: '#ffffff',
                          strokeWidth: 1.5,
                          fill: 'none',
                        })
                      )
                    ),
                    h(Text, { key: 'summary-title', style: styles.cardTitle }, 'RÉSUMÉ FINANCIER'),
                  ]
                ),

                h(View, { key: 'summary-divider', style: styles.cardDivider }),

                // ROWS
                h(
                  View,
                  { key: 'summary-row-1', style: styles.summaryRow },
                  [
                    h(Text, { key: 'summary-label-1', style: styles.summaryLabel }, 'Total frais'),
                    h(Text, { key: 'summary-value-1', style: styles.summaryValue }, money(totalFrais)),
                  ]
                ),

                h(
                  View,
                  { key: 'summary-row-2', style: styles.summaryRow },
                  [
                    h(Text, { key: 'summary-label-2', style: styles.summaryLabel }, 'Total prix'),
                    h(Text, { key: 'summary-value-2', style: styles.summaryValue }, money(totalPrix)),
                  ]
                ),

                // TOTAL HIGHLIGHT
                h(
                  View,
                  { key: 'summary-highlight', style: styles.summaryHighlight },
                  [
                    h(Text, { key: 'summary-total-label', style: styles.summaryTotalLabel }, 'Total général'),
                    h(Text, { key: 'summary-total-value', style: styles.summaryTotalValue }, money(totalGeneral)),
                  ]
                ),
              ]
            ),
          ]
        ),
        h(
          View,
          { key: 'footer', style: styles.footer },
          [
            h(Text, { key: 'footer-1', style: styles.footerText }, 'LogiTrack'),

            h(
              Text,
              { key: 'footer-2', style: styles.footerText },
              `Document généré le ${formatDate(new Date().toISOString())}`
            ),

            h(
              Text,
              { key: 'footer-3', style: styles.footerText },
              `Total: ${money(totalGeneral)}`
            ),
          ]
)
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
