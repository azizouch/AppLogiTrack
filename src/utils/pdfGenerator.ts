import { Bon } from '@/types';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// Print bon - opens print dialog (like the screenshot)
export const printBon = async (bon: Bon): Promise<void> => {
  // Use the same content as PDF download for consistency
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bon de Distribution #${bon.id}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 14px;
          line-height: 1.3;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          table-layout: fixed !important;
        }
        td, th {
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .price-cell {
          min-width: 80px !important;
          white-space: nowrap !important;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
            font-size: 12px;
            line-height: 1.2;
          }
          .no-print { display: none; }
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      </style>
    </head>
    <body>
      ${generatePDFContent(bon)}
    </body>
    </html>
  `;

  // Create a hidden iframe in the same origin to avoid security issues
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  return new Promise((resolve, reject) => {
    try {
      // Write content directly to iframe document (same origin)
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        // Wait for content to load, then trigger print dialog
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();

            // Clean up after a delay
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
              resolve();
            }, 1000);
          } catch (error) {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            reject(error);
          }
        }, 500);
      } else {
        document.body.removeChild(iframe);
        reject(new Error('Unable to access iframe document'));
      }
    } catch (error) {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      reject(error);
    }
  });
};

// Generate simplified PDF content (optimized for PDF generation)
const generatePDFContent = (bon: Bon): string => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (statut: string) => {
    switch (statut.toLowerCase()) {
      case 'en cours':
        return 'En cours';
      case 'complété':
      case 'complete':
        return 'Complété';
      case 'annulé':
      case 'annule':
        return 'Annulé';
      default:
        return statut;
    }
  };

  // Sample colis data
  const sampleColis = [
    {
      reference: 'COL-2024-001',
      client: 'Ahmed Benali',
      entreprise: 'TechCorp SARL',
      adresse: '123 Rue Mohammed V, Casablanca',
      prix: 250.00,
      frais: 25.00,
      statut: 'En cours'
    },
    {
      reference: 'COL-2024-002',
      client: 'Fatima Zahra',
      entreprise: 'Digital Solutions',
      adresse: '456 Avenue Hassan II, Rabat',
      prix: 180.50,
      frais: 20.00,
      statut: 'En cours'
    },
    {
      reference: 'COL-2024-003',
      client: 'Omar Alami',
      entreprise: 'Import Export Co',
      adresse: '789 Boulevard Zerktouni, Marrakech',
      prix: 320.75,
      frais: 30.00,
      statut: 'En cours'
    },
    {
      reference: 'COL-2024-004',
      client: 'Aicha Mansouri',
      entreprise: 'Fashion Store',
      adresse: '321 Rue de la Liberté, Fès',
      prix: 95.25,
      frais: 15.00,
      statut: 'En cours'
    }
  ];

  const totalPrix = sampleColis.reduce((sum, colis) => sum + colis.prix, 0);
  const totalFrais = sampleColis.reduce((sum, colis) => sum + colis.frais, 0);
  const totalGeneral = totalPrix + totalFrais;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px 40px; background: white; font-size: 14px; line-height: 1.4;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid #2563eb; padding-bottom: 15px;">
        <table style="width: 100%; margin-bottom: 10px; border-collapse: collapse;">
          <tr>
            <td style="text-align: center; vertical-align: middle; padding: 0; border: none; line-height: 30px;">
              <img src="/logo.jpg" alt="LogiTrack Logo" style="height: 30px; width: 30px; vertical-align: middle; margin-right: 8px; display: inline-block;" onerror="this.style.display='none'">
              <span style="color: #2563eb; font-size: 28px; font-weight: bold; vertical-align: middle; display: inline-block; line-height: 30px;">BON DE DISTRIBUTION</span>
            </td>
          </tr>
        </table>
        <p style="color: #666; font-size: 16px; margin: 0;">LogiTrack - Système de gestion logistique</p>
      </div>

      <!-- Bon Info -->
      <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px;">
        <div style="flex: 1; background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 2px solid #2563eb;">
          <h3 style="color: #2563eb; margin-bottom: 12px; font-size: 16px; margin-top: 0; font-weight: bold;">Informations générales</h3>
          <div style="margin-bottom: 8px; font-size: 14px;">
            <strong style="color: #475569;">ID Bon:</strong> <span style="color: #1e293b;">${bon.id}</span>
          </div>
          <div style="margin-bottom: 8px; font-size: 14px;">
            <strong style="color: #475569;">Type:</strong> <span style="color: #1e293b;">${bon.type.charAt(0).toUpperCase() + bon.type.slice(1)}</span>
          </div>
          <div style="margin-bottom: 8px; font-size: 14px;">
            <strong style="color: #475569;">Statut:</strong>
            <span style="display: inline-block; padding: 4px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; text-transform: uppercase; background: #dbeafe; color: #1e40af;">${getStatusText(bon.statut)}</span>
          </div>
          <div style="margin-bottom: 8px; font-size: 14px;">
            <strong style="color: #475569;">Date de création:</strong> <span style="color: #1e293b;">${formatDate(bon.date_creation)}</span>
          </div>
          ${bon.nb_colis ? `
          <div style="margin-bottom: 8px; font-size: 14px;">
            <strong style="color: #475569;">Nombre de colis:</strong> <span style="color: #1e293b;">${bon.nb_colis} colis</span>
          </div>
          ` : ''}
        </div>

        ${bon.user ? `
        <div style="flex: 1; background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 2px solid #2563eb;">
          <h3 style="color: #2563eb; margin-bottom: 12px; font-size: 16px; margin-top: 0; font-weight: bold;">Livreur assigné</h3>
          <div style="margin-bottom: 8px; font-size: 14px;">
            <strong style="color: #475569;">Nom:</strong> <span style="color: #1e293b;">${bon.user.nom} ${bon.user.prenom || ''}</span>
          </div>
          ${bon.user.email ? `
          <div style="margin-bottom: 8px; font-size: 14px;">
            <strong style="color: #475569;">Email:</strong> <span style="color: #1e293b;">${bon.user.email}</span>
          </div>
          ` : ''}
          ${bon.user.telephone ? `
          <div style="margin-bottom: 8px; font-size: 14px;">
            <strong style="color: #475569;">Téléphone:</strong> <span style="color: #1e293b;">${bon.user.telephone}</span>
          </div>
          ` : ''}
          ${bon.user.vehicule ? `
          <div style="margin-bottom: 8px; font-size: 14px;">
            <strong style="color: #475569;">Véhicule:</strong> <span style="color: #1e293b;">${bon.user.vehicule}</span>
          </div>
          ` : ''}
          ${bon.user.zone ? `
          <div style="margin-bottom: 8px; font-size: 14px;">
            <strong style="color: #475569;">Zone:</strong> <span style="color: #1e293b;">${bon.user.zone}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>

      <!-- Colis Table -->
      <div style="margin: 20px 0 15px 0;">
        <h3 style="color: #2563eb; margin-bottom: 15px; font-size: 18px; font-weight: bold;">Liste des Colis (${sampleColis.length} colis)</h3>
        <div style="border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; background: white;">
          <!-- Table Header -->
          <div style="background: #2563eb; color: white; display: flex; font-weight: 600; font-size: 12px; text-transform: uppercase; min-height: 40px;">
            <div style="flex: 1; padding: 12px 8px; border-right: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: flex-start;">Référence</div>
            <div style="flex: 1; padding: 12px 8px; border-right: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: flex-start;">Client</div>
            <div style="flex: 1; padding: 12px 8px; border-right: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: flex-start;">Entreprise</div>
            <div style="flex: 1.5; padding: 12px 8px; border-right: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: flex-start;">Adresse</div>
            <div style="flex: 0.8; padding: 12px 8px; border-right: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;">Frais (DH)</div>
            <div style="flex: 0.8; padding: 12px 8px; display: flex; align-items: center; justify-content: center;">Prix (DH)</div>
          </div>

          <!-- Table Body -->
          ${sampleColis.map((colis, index) => `
            <div style="background: ${index % 2 === 0 ? 'white' : '#f8fafc'}; display: flex; border-bottom: 1px solid #e2e8f0; font-size: 12px; min-height: 30px;">
              <div style="flex: 1; padding: 8px 6px; border-right: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: flex-start;"><strong>${colis.reference}</strong></div>
              <div style="flex: 1; padding: 8px 6px; border-right: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: flex-start;">${colis.client}</div>
              <div style="flex: 1; padding: 8px 6px; border-right: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: flex-start;">${colis.entreprise}</div>
              <div style="flex: 1.5; padding: 8px 6px; border-right: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: flex-start;">${colis.adresse}</div>
              <div style="flex: 0.8; padding: 8px 6px; border-right: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #059669;">${colis.frais.toFixed(2)} DH</div>
              <div style="flex: 0.8; padding: 8px 6px; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #059669;">${colis.prix.toFixed(2)} DH</div>
            </div>
          `).join('')}

          <!-- Total Row -->
          <div style="background: #f1f5f9; display: flex; border-top: 2px solid #2563eb; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 14px; min-height: 40px;">
            <div style="flex: 1; padding: 12px 8px; display: flex; align-items: center; justify-content: flex-start;"><strong>TOTAL</strong></div>
            <div style="flex: 1; padding: 12px 8px; display: flex; align-items: center; justify-content: flex-start;"></div>
            <div style="flex: 1; padding: 12px 8px; display: flex; align-items: center; justify-content: flex-start;"></div>
            <div style="flex: 1.5; padding: 12px 8px; display: flex; align-items: center; justify-content: flex-start;"></div>
            <div style="flex: 0.8; padding: 12px 8px; display: flex; align-items: center; justify-content: center; white-space: nowrap;"><strong>${totalFrais.toFixed(2)} DH</strong></div>
            <div style="flex: 0.8; padding: 12px 8px; display: flex; align-items: center; justify-content: center; white-space: nowrap;"><strong>${totalPrix.toFixed(2)} DH</strong></div>
          </div>

          <!-- Total General Row -->
          <div style="background: #f1f5f9; display: flex; border-top: 1px solid #2563eb; font-weight: 600; font-size: 14px; min-height: 40px;">
            <div style="flex: 4.8; padding: 12px 8px; display: flex; align-items: center; justify-content: flex-start;"><strong>TOTAL GÉNÉRAL</strong></div>
            <div style="flex: 1.6; padding: 12px 8px; display: flex; align-items: center; justify-content: center; white-space: nowrap;"><strong>${totalGeneral.toFixed(2)} DH</strong></div>
          </div>
        </div>
      </div>

      ${bon.notes ? `
      <div style="margin-top: 30px; padding: 20px; background: #f1f5f9; border-radius: 10px;">
        <h3 style="color: #2563eb; margin-bottom: 12px; margin-top: 0; font-size: 18px;">Notes</h3>
        <p style="margin: 0; font-size: 15px;">${bon.notes}</p>
      </div>
      ` : ''}

      <div style="margin-top: 35px; text-align: center; padding-top: 20px; border-top: 2px solid #e2e8f0; color: #64748b; font-size: 14px;">
        <p style="margin: 0 0 10px 0;">Document généré le ${formatDate(new Date().toISOString())} par LogiTrack</p>
        <p style="margin: 0;"><strong>Total des colis: ${sampleColis.length} | Montant total: ${totalGeneral.toFixed(2)} DH</strong></p>
      </div>
    </div>
  `;
};

// Check if user is on mobile device
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Helper function to wrap text within a given width
const wrapText = (pdf: jsPDF, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const textWidth = pdf.getTextWidth(testLine);

    if (textWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is too long, break it
        lines.push(word);
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

// Download bon as PDF file directly to Downloads folder (using same HTML content as print)
export const downloadBonAsPDF = async (bon: Bon): Promise<void> => {
  try {
    // Use the exact same HTML content as printBon for consistency
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bon de Distribution #${bon.id}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.3;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            
          }
          td, th {
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .price-cell {
            min-width: 80px !important;
            white-space: nowrap !important;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
              font-size: 12px;
              line-height: 1.2;
            }
            .no-print { display: none; }
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        ${generatePDFContent(bon)}
      </body>
      </html>
    `;

    // Import html2canvas and jsPDF dynamically for PDF generation
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    // Create a temporary container to render the HTML
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = htmlContent.replace(/<html[^>]*>|<\/html>|<head[^>]*>[\s\S]*?<\/head>|<body[^>]*>|<\/body>/gi, '');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '210mm';
    tempContainer.style.height = 'auto';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.fontSize = '14px';
    tempContainer.style.lineHeight = '1.3';

    document.body.appendChild(tempContainer);

    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate PDF using html2canvas and jsPDF
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: tempContainer.scrollWidth,
      height: tempContainer.scrollHeight
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate filename and download
    const filename = `Bon_Distribution_${bon.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);

    // Clean up
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Erreur lors de la génération du PDF');
  }
};

// Helper functions for PDF content generation
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusText = (statut: string) => {
  switch (statut.toLowerCase()) {
    case 'en cours':
      return 'En cours';
    case 'complété':
    case 'complete':
      return 'Complété';
    case 'annulé':
    case 'annule':
      return 'Annulé';
    default:
      return statut;
  }
};

// Generate mobile-optimized PDF content (card-based layout instead of table)
const generateMobilePDFContent = (bon: Bon): string => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (statut: string) => {
    switch (statut.toLowerCase()) {
      case 'en cours':
        return 'En cours';
      case 'complété':
      case 'complete':
        return 'Complété';
      case 'annulé':
      case 'annule':
        return 'Annulé';
      default:
        return statut;
    }
  };

  // Sample colis data
  const sampleColis = [
    {
      reference: 'COL-2024-001',
      client: 'Ahmed Benali',
      entreprise: 'TechCorp SARL',
      adresse: '123 Rue Mohammed V, Casablanca',
      prix: 250.00,
      frais: 25.00,
      statut: 'En cours'
    },
    {
      reference: 'COL-2024-002',
      client: 'Fatima Zahra',
      entreprise: 'Digital Solutions',
      adresse: '456 Avenue Hassan II, Rabat',
      prix: 180.50,
      frais: 20.00,
      statut: 'En cours'
    },
    {
      reference: 'COL-2024-003',
      client: 'Omar Alami',
      entreprise: 'Import Export Co',
      adresse: '789 Boulevard Zerktouni, Marrakech',
      prix: 320.75,
      frais: 30.00,
      statut: 'En cours'
    },
    {
      reference: 'COL-2024-004',
      client: 'Aicha Mansouri',
      entreprise: 'Fashion Store',
      adresse: '321 Rue de la Liberté, Fès',
      prix: 95.25,
      frais: 15.00,
      statut: 'En cours'
    },
    {
      reference: 'COL-2024-005',
      client: 'Youssef Alami',
      entreprise: 'Global Trade',
      adresse: '654 Avenue Royale, Agadir',
      prix: 175.00,
      frais: 18.00,
      statut: 'En cours'
    }
  ];

  const totalPrix = sampleColis.reduce((sum, colis) => sum + colis.prix, 0);
  const totalFrais = sampleColis.reduce((sum, colis) => sum + colis.frais, 0);
  const totalGeneral = totalPrix + totalFrais;

  // Split colis into chunks that fit on a page (approximately 6-8 colis per page for mobile)
  const colisPerPage = 6;
  const colisPages = [];
  for (let i = 0; i < sampleColis.length; i += colisPerPage) {
    colisPages.push(sampleColis.slice(i, i + colisPerPage));
  }

  return `
    <style>
      @media print {
        .page-break-inside-avoid {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .page-break-before { page-break-before: always !important; }
        .page-break-after { page-break-after: always !important; }
      }

      /* Ensure no breaks within cards */
      .colis-card {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        display: block !important;
        margin-bottom: 8px !important;
      }

      /* Page container */
      .page {
        min-height: 250mm;
        page-break-after: always;
      }

      .page:last-child {
        page-break-after: avoid;
      }

      /* Header section */
      .header-section {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      /* Info sections */
      .info-section {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    </style>
    <div style="font-family: Arial, sans-serif; width: 100%; margin: 0; padding: 0; background: white; font-size: 10px; line-height: 1.2;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 8px; border-bottom: 1px solid #2563eb; padding-bottom: 6px;">
        <h1 style="color: #2563eb; font-size: 14px; margin-bottom: 2px; margin-top: 0; font-weight: bold;">BON DE DISTRIBUTION</h1>
        <p style="color: #666; font-size: 8px; margin: 0;">LogiTrack - Système de gestion logistique</p>
      </div>

      <!-- Bon Info - Compact -->
      <div style="margin-bottom: 8px;">
        <div style="background: #f8fafc; padding: 8px; border-radius: 3px; border-left: 2px solid #2563eb; margin-bottom: 4px;">
          <h3 style="color: #2563eb; margin-bottom: 6px; font-size: 11px; margin-top: 0; font-weight: bold;">Informations générales</h3>
          <div style="margin-bottom: 4px; font-size: 9px;">
            <strong style="color: #475569;">ID:</strong>
            <span style="color: #1e293b; margin-left: 2px;">${bon.id}</span>
          </div>
          <div style="margin-bottom: 4px; font-size: 9px;">
            <strong style="color: #475569;">Type:</strong>
            <span style="color: #1e293b; margin-left: 2px;">${bon.type.charAt(0).toUpperCase() + bon.type.slice(1)}</span>
          </div>
          <div style="margin-bottom: 4px; font-size: 9px;">
            <strong style="color: #475569;">Statut:</strong>
            <span style="display: inline-block; padding: 1px 4px; border-radius: 2px; font-size: 8px; font-weight: 600; background: #dbeafe; color: #1e40af; margin-left: 2px;">${getStatusText(bon.statut)}</span>
          </div>
          <div style="margin-bottom: 4px; font-size: 9px;">
            <strong style="color: #475569;">Date:</strong>
            <span style="color: #1e293b; margin-left: 2px;">${formatDate(bon.date_creation)}</span>
          </div>
          ${bon.nb_colis ? `
          <div style="font-size: 9px; margin-bottom: 2px;">
            <strong style="color: #475569;">Colis:</strong>
            <span style="color: #1e293b; margin-left: 2px;">${bon.nb_colis}</span>
          </div>
          ` : ''}
        </div>

        ${bon.user ? `
        <div style="background: #f8fafc; padding: 8px; border-radius: 3px; border-left: 2px solid #2563eb;">
          <h3 style="color: #2563eb; margin-bottom: 6px; font-size: 11px; margin-top: 0; font-weight: bold;">Livreur assigné</h3>
          <div style="margin-bottom: 4px; font-size: 9px;">
            <strong style="color: #475569;">Nom:</strong>
            <span style="color: #1e293b; margin-left: 2px;">${bon.user.nom} ${bon.user.prenom || ''}</span>
          </div>
          ${bon.user.email ? `
          <div style="margin-bottom: 4px; font-size: 9px;">
            <strong style="color: #475569;">Email:</strong>
            <span style="color: #1e293b; margin-left: 2px;">${bon.user.email}</span>
          </div>
          ` : ''}
          ${bon.user.telephone ? `
          <div style="margin-bottom: 4px; font-size: 9px;">
            <strong style="color: #475569;">Tél:</strong>
            <span style="color: #1e293b; margin-left: 2px;">${bon.user.telephone}</span>
          </div>
          ` : ''}
          ${bon.user.vehicule ? `
          <div style="margin-bottom: 4px; font-size: 9px;">
            <strong style="color: #475569;">Véhicule:</strong>
            <span style="color: #1e293b; margin-left: 2px;">${bon.user.vehicule}</span>
          </div>
          ` : ''}
          ${bon.user.zone ? `
          <div style="font-size: 9px; margin-bottom: 2px;">
            <strong style="color: #475569;">Zone:</strong>
            <span style="color: #1e293b; margin-left: 2px;">${bon.user.zone}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>

        <!-- First Page Colis -->
        <div style="margin: 8px 0;">
          <h3 style="color: #2563eb; margin-bottom: 6px; font-size: 11px; font-weight: bold;">Liste des Colis (${sampleColis.length} colis)</h3>

          ${colisPages[0] ? colisPages[0].map((colis) => `
            <div class="colis-card" style="background: white; border: 1px solid #e2e8f0; border-radius: 3px; padding: 6px; margin-bottom: 6px;">
              <div style="margin-bottom: 3px; font-size: 8px;">
                <strong style="color: #2563eb;">Réf:</strong>
                <span style="color: #1e293b; font-weight: 600; margin-left: 2px;">${colis.reference}</span>
              </div>
              <div style="margin-bottom: 3px; font-size: 8px;">
                <strong style="color: #475569;">Client:</strong>
                <span style="color: #1e293b; margin-left: 2px;">${colis.client}</span>
              </div>
              <div style="margin-bottom: 3px; font-size: 8px;">
                <strong style="color: #475569;">Entreprise:</strong>
                <span style="color: #1e293b; margin-left: 2px;">${colis.entreprise}</span>
              </div>
              <div style="margin-bottom: 3px; font-size: 8px;">
                <strong style="color: #475569;">Adresse:</strong>
                <span style="color: #1e293b; margin-left: 2px;">${colis.adresse}</span>
              </div>
              <div style="font-size: 8px; margin-bottom: 2px;">
                <strong style="color: #059669;">Prix:</strong>
                <span style="color: #059669; font-weight: 600; margin-left: 2px;">${colis.prix.toFixed(2)} DH</span>
                <strong style="color: #059669; margin-left: 8px;">Frais:</strong>
                <span style="color: #059669; font-weight: 600; margin-left: 2px;">${colis.frais.toFixed(2)} DH</span>
              </div>
            </div>
          `).join('') : ''}

        </div>
      </div>

      <!-- Additional Pages for Remaining Colis -->
      ${colisPages.slice(1).map((pageColisArray, pageIndex) => `
        <div class="page page-break-before">
          <!-- Page Header -->
          <div class="header-section" style="text-align: center; margin-bottom: 8px; border-bottom: 1px solid #2563eb; padding-bottom: 6px;">
            <h1 style="color: #2563eb; font-size: 14px; margin-bottom: 2px; margin-top: 0; font-weight: bold;">BON DE DISTRIBUTION</h1>
            <p style="color: #666; font-size: 8px; margin: 0;">Page ${pageIndex + 2} - Suite des colis</p>
          </div>

          <!-- Colis for this page -->
          <div style="margin: 8px 0;">
            ${pageColisArray.map((colis) => `
              <div class="colis-card" style="background: white; border: 1px solid #e2e8f0; border-radius: 3px; padding: 6px; margin-bottom: 6px;">
                <div style="margin-bottom: 3px; font-size: 8px;">
                  <strong style="color: #2563eb;">Réf:</strong>
                  <span style="color: #1e293b; font-weight: 600; margin-left: 2px;">${colis.reference}</span>
                </div>
                <div style="margin-bottom: 3px; font-size: 8px;">
                  <strong style="color: #475569;">Client:</strong>
                  <span style="color: #1e293b; margin-left: 2px;">${colis.client}</span>
                </div>
                <div style="margin-bottom: 3px; font-size: 8px;">
                  <strong style="color: #475569;">Entreprise:</strong>
                  <span style="color: #1e293b; margin-left: 2px;">${colis.entreprise}</span>
                </div>
                <div style="margin-bottom: 3px; font-size: 8px;">
                  <strong style="color: #475569;">Adresse:</strong>
                  <span style="color: #1e293b; margin-left: 2px;">${colis.adresse}</span>
                </div>
                <div style="font-size: 8px; margin-bottom: 2px;">
                  <strong style="color: #059669;">Prix:</strong>
                  <span style="color: #059669; font-weight: 600; margin-left: 2px;">${colis.prix.toFixed(2)} DH</span>
                  <strong style="color: #059669; margin-left: 8px;">Frais:</strong>
                  <span style="color: #059669; font-weight: 600; margin-left: 2px;">${colis.frais.toFixed(2)} DH</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}

      <!-- Final Page with Totals -->
      <div class="page page-break-before">
        <!-- Totals -->
        <div style="background: #f1f5f9; border: 1px solid #2563eb; border-radius: 3px; padding: 8px; margin-top: 6px;">
          <div style="margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid #cbd5e1; font-size: 9px;">
            <strong style="color: #2563eb;">TOTAL PRIX:</strong>
            <span style="color: #059669; font-weight: 700; float: right;">${totalPrix.toFixed(2)} DH</span>
          </div>
          <div style="margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid #cbd5e1; font-size: 9px;">
            <strong style="color: #2563eb;">TOTAL FRAIS:</strong>
            <span style="color: #059669; font-weight: 700; float: right;">${totalFrais.toFixed(2)} DH</span>
          </div>
          <div style="font-size: 10px; margin-bottom: 2px;">
            <strong style="color: #2563eb;">TOTAL GÉNÉRAL:</strong>
            <span style="color: #059669; font-weight: 700; float: right;">${totalGeneral.toFixed(2)} DH</span>
          </div>
        </div>


        <!-- Notes -->
        <div style="margin-top: 6px; padding: 8px; background: #f8fafc; border-radius: 3px; border-left: 2px solid #2563eb;">
          <h4 style="color: #2563eb; margin-bottom: 4px; font-size: 9px; margin-top: 0;">Notes</h4>
          <p style="color: #475569; margin: 0; margin-bottom: 2px; font-size: 8px; line-height: 1.2;">
            ${bon.notes || 'Livraison prioritaire - Contacter le client avant livraison'}
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 7px;">
          <p style="margin: 0;">Document généré le ${formatDate(new Date().toISOString())} par LogiTrack</p>
          <p style="margin: 1px 0 0 0;">Total des colis: ${sampleColis.length} | Montant total: ${totalGeneral.toFixed(2)} DH</p>
        </div>
      </div>
    </div>
  `;
};

// Download mobile-optimized PDF with proper page breaks (no html2canvas)
export const downloadMobileBonAsPDF = async (bon: Bon): Promise<void> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getStatusText = (statut: string) => {
      switch (statut.toLowerCase()) {
        case 'en cours':
          return 'En cours';
        case 'complété':
        case 'complete':
          return 'Complété';
        case 'annulé':
        case 'annule':
          return 'Annulé';
        default:
          return statut;
      }
    };

    // Sample colis data
    const sampleColis = [
      {
        reference: 'COL-2024-001',
        client: 'Ahmed Benali',
        entreprise: 'TechCorp SARL',
        adresse: '123 Rue Mohammed V, Casablanca',
        prix: 250.00,
        frais: 25.00,
        statut: 'En cours'
      },
      {
        reference: 'COL-2024-002',
        client: 'Fatima Zahra',
        entreprise: 'Digital Solutions',
        adresse: '456 Avenue Hassan II, Rabat',
        prix: 180.50,
        frais: 20.00,
        statut: 'En cours'
      },
      {
        reference: 'COL-2024-003',
        client: 'Omar Alami',
        entreprise: 'Import Export Co',
        adresse: '789 Boulevard Zerktouni, Marrakech',
        prix: 320.75,
        frais: 30.00,
        statut: 'En cours'
      },
      {
        reference: 'COL-2024-004',
        client: 'Aicha Mansouri',
        entreprise: 'Fashion Store',
        adresse: '321 Rue de la Liberté, Fès',
        prix: 95.25,
        frais: 15.00,
        statut: 'En cours'
      },
      {
        reference: 'COL-2024-005',
        client: 'Youssef Alami',
        entreprise: 'Global Trade',
        adresse: '654 Avenue Royale, Agadir',
        prix: 175.00,
        frais: 18.00,
        statut: 'En cours'
      }
    ];

    const totalPrix = sampleColis.reduce((sum, colis) => sum + colis.prix, 0);
    const totalFrais = sampleColis.reduce((sum, colis) => sum + colis.frais, 0);
    const totalGeneral = totalPrix + totalFrais;

    // Set font
    pdf.setFont('helvetica');

    let currentY = margin;
    let pageNumber = 1;

    // Helper function to add a new page
    const addNewPage = () => {
      pdf.addPage();
      pageNumber++;
      currentY = margin;
    };

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredHeight: number) => {
      if (currentY + requiredHeight > pageHeight - margin) {
        addNewPage();
        return true;
      }
      return false;
    };

    // Page 1: Header and Info
    // Header with Logo
    try {
      // Load logo from public folder
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => {
          // Create canvas to convert image to base64
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = logoImg.width;
          canvas.height = logoImg.height;
          ctx?.drawImage(logoImg, 0, 0);

          try {
            const logoBase64 = canvas.toDataURL('image/png');
            // Add logo to PDF
            pdf.addImage(logoBase64, 'PNG', margin, currentY, 15, 15);
            resolve();
          } catch (error) {
            console.warn('Could not load logo, using fallback');
            // Fallback to text logo
            pdf.setFillColor(37, 99, 235);
            pdf.circle(margin + 7.5, currentY + 7.5, 7.5, 'F');
            pdf.setFontSize(10);
            pdf.setTextColor(255, 255, 255);
            pdf.text('LT', margin + 7.5, currentY + 10, { align: 'center' });
            resolve();
          }
        };

        logoImg.onerror = () => {
          console.warn('Logo not found, using fallback');
          // Fallback to text logo
          pdf.setFillColor(37, 99, 235);
          pdf.circle(margin + 7.5, currentY + 7.5, 7.5, 'F');
          pdf.setFontSize(10);
          pdf.setTextColor(255, 255, 255);
          pdf.text('LT', margin + 7.5, currentY + 10, { align: 'center' });
          resolve();
        };

        logoImg.src = '/logo.jpg'; // Assuming logo.png in public folder
      });
    } catch (error) {
      console.warn('Error loading logo:', error);
      // Fallback to text logo
      pdf.setFillColor(37, 99, 235);
      pdf.circle(margin + 7.5, currentY + 7.5, 7.5, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.text('LT', margin + 7.5, currentY + 10, { align: 'center' });
    }

    // Company name next to logo
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(37, 99, 235); // Blue color
    pdf.text('LogiTrack', margin + 20, currentY + 10);

    // Main title centered
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(37, 99, 235); // Blue color
    pdf.text('BON DE DISTRIBUTION', pageWidth / 2, currentY + 8, { align: 'center' });
    currentY += 15;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(102, 102, 102); // Gray color
    pdf.text('Système de gestion logistique', pageWidth / 2, currentY, { align: 'center' });
    currentY += 20; // Increased spacing to match colis cards spacing

    // Two-column layout for Bon Info and Livreur Info
    const leftColumnX = margin;
    const rightColumnX = pageWidth / 2 + 5;
    const columnWidth = (contentWidth / 2) - 5;

    // Left Column: Bon Info Section
    const bonInfoStartY = currentY;

    // Bon Info Card Background (rounded)
    pdf.setFillColor(248, 250, 252); // Light blue background
    pdf.setDrawColor(37, 99, 235); // Blue border
    pdf.setLineWidth(0.5);
    pdf.roundedRect(leftColumnX, bonInfoStartY, columnWidth, 45, 3, 3, 'FD'); // Rounded Fill and Draw

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(37, 99, 235);
    pdf.text('Informations générales', leftColumnX + 3, bonInfoStartY + 6);
    pdf.setFont('helvetica', 'normal');

    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`ID: ${bon.id}`, leftColumnX + 3, bonInfoStartY + 12);
    pdf.text(`Type: ${bon.type.charAt(0).toUpperCase() + bon.type.slice(1)}`, leftColumnX + 3, bonInfoStartY + 17);
    pdf.text(`Statut: ${getStatusText(bon.statut)}`, leftColumnX + 3, bonInfoStartY + 22);
    pdf.text(`Date: ${formatDate(bon.date_creation)}`, leftColumnX + 3, bonInfoStartY + 27);
    if (bon.nb_colis) {
      pdf.text(`Colis: ${bon.nb_colis}`, leftColumnX + 3, bonInfoStartY + 32);
    }

    // Right Column: Livreur Info (if exists)
    if (bon.user) {
      // Livreur Info Card Background (rounded)
      pdf.setFillColor(248, 250, 252); // Light blue background
      pdf.setDrawColor(37, 99, 235); // Blue border
      pdf.setLineWidth(0.5);
      pdf.roundedRect(rightColumnX, bonInfoStartY, columnWidth, 45, 3, 3, 'FD'); // Rounded Fill and Draw

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(37, 99, 235);
      pdf.text('Livreur assigné', rightColumnX + 3, bonInfoStartY + 6);
      pdf.setFont('helvetica', 'normal');

      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      let livreurY = bonInfoStartY + 12;
      pdf.text(`Nom: ${bon.user.nom} ${bon.user.prenom || ''}`, rightColumnX + 3, livreurY);
      livreurY += 5;

      if (bon.user.email) {
        pdf.text(`Email: ${bon.user.email}`, rightColumnX + 3, livreurY);
        livreurY += 5;
      }
      if (bon.user.telephone) {
        pdf.text(`Tél: ${bon.user.telephone}`, rightColumnX + 3, livreurY);
        livreurY += 5;
      }
      if (bon.user.vehicule) {
        pdf.text(`Véhicule: ${bon.user.vehicule}`, rightColumnX + 3, livreurY);
        livreurY += 5;
      }
      if (bon.user.zone) {
        pdf.text(`Zone: ${bon.user.zone}`, rightColumnX + 3, livreurY);
        livreurY += 5;
      }
    }

    currentY = bonInfoStartY + 50; // Move past both cards

    // Colis List Header with spacing matching colis cards
    currentY += 5; // Top spacing same as between colis cards
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold'); // Make title bold
    pdf.setTextColor(37, 99, 235);
    pdf.text(`Liste des Colis (${sampleColis.length} colis)`, margin, currentY);
    pdf.setFont('helvetica', 'normal'); // Reset font weight
    currentY += 5; // Bottom spacing same as between colis cards

    // Process each colis individually to avoid page breaks
    sampleColis.forEach((colis) => {
      const colisHeight = 38; // Estimated height for each colis card

      // Check if we need a new page for this colis
      if (checkPageBreak(colisHeight)) {
        // Add page header for continuation
        pdf.setFontSize(14);
        pdf.setTextColor(37, 99, 235);
        pdf.text('BON DE DISTRIBUTION', pageWidth / 2, currentY, { align: 'center' });
        currentY += 6;
        pdf.setFontSize(8);
        pdf.setTextColor(102, 102, 102);
        pdf.text(`Page ${pageNumber} - Suite des colis`, pageWidth / 2, currentY, { align: 'center' });
        currentY += 15;
      }

      // Draw colis card with improved styling
      const cardStartY = currentY;
      const cardHeight = 35;

      // Card background (rounded)
      pdf.setFillColor(255, 255, 255); // White background
      pdf.setDrawColor(226, 232, 240); // Light gray border
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, cardStartY, contentWidth, cardHeight, 3, 3, 'FD'); // Rounded Fill and Draw

      // Header section with reference (blue background, rounded top)
      pdf.setFillColor(37, 99, 235); // Blue background for header
      pdf.roundedRect(margin, cardStartY, contentWidth, 8, 3, 3, 'F');

      // Cover the bottom corners of the header to make only top rounded
      pdf.setFillColor(37, 99, 235);
      pdf.rect(margin, cardStartY + 5, contentWidth, 3, 'F');

      // Reference number in white
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255); // White text
      pdf.text(`Réf: ${colis.reference}`, margin + 3, cardStartY + 5);

      // Card content
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);

      // Client info
      pdf.text(`Client: ${colis.client}`, margin + 3, cardStartY + 12);
      pdf.text(`Entreprise: ${colis.entreprise}`, margin + 3, cardStartY + 17);

      // Split long addresses if needed
      const maxAddressWidth = contentWidth - 6;
      const addressLines = pdf.splitTextToSize(`Adresse: ${colis.adresse}`, maxAddressWidth);
      pdf.text(addressLines[0], margin + 3, cardStartY + 22);
      if (addressLines.length > 1) {
        pdf.text(addressLines[1], margin + 3, cardStartY + 27);
      }

      // Price section with background (rounded bottom)
      const priceY = cardStartY + (addressLines.length > 1 ? 32 : 27);
      pdf.setFillColor(240, 253, 244); // Light green background for prices
      pdf.roundedRect(margin, priceY - 2, contentWidth, 6, 3, 3, 'F');

      // Cover the top corners of the price section to make only bottom rounded
      pdf.setFillColor(240, 253, 244);
      pdf.rect(margin, priceY - 2, contentWidth, 3, 'F');

      // Price info in green
      pdf.setTextColor(5, 150, 105); // Green color
      pdf.setFontSize(8);
      pdf.text(`Prix: ${colis.prix.toFixed(2)} DH`, margin + 3, priceY + 2);
      pdf.text(`Frais: ${colis.frais.toFixed(2)} DH`, margin + 80, priceY + 2);

      currentY += 40; // Move to next colis position with spacing
    });

    // Add totals on a new page or at the end
    const totalsHeight = 40;
    if (checkPageBreak(totalsHeight)) {
      // Add page header for totals
      pdf.setFontSize(14);
      pdf.setTextColor(37, 99, 235);
      pdf.text('BON DE DISTRIBUTION', pageWidth / 2, currentY, { align: 'center' });
      currentY += 6;
      pdf.setFontSize(8);
      pdf.setTextColor(102, 102, 102);
      pdf.text(`Page ${pageNumber} - Totaux`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;
    }

    // Totals section (rounded)
    pdf.setFillColor(241, 245, 249); // Light blue background
    pdf.setDrawColor(37, 99, 235); // Blue border
    pdf.setLineWidth(0.5);
    pdf.roundedRect(margin, currentY, contentWidth, 25, 3, 3, 'FD');

    pdf.setFontSize(10);
    pdf.setTextColor(37, 99, 235);
    pdf.text('TOTAL PRIX:', margin + 3, currentY + 6);
    pdf.text(`${totalPrix.toFixed(2)} DH`, pageWidth - margin - 3, currentY + 6, { align: 'right' });

    pdf.text('TOTAL FRAIS:', margin + 3, currentY + 12);
    pdf.text(`${totalFrais.toFixed(2)} DH`, pageWidth - margin - 3, currentY + 12, { align: 'right' });

    pdf.setFontSize(11);
    pdf.text('TOTAL GÉNÉRAL:', margin + 3, currentY + 20);
    pdf.text(`${totalGeneral.toFixed(2)} DH`, pageWidth - margin - 3, currentY + 20, { align: 'right' });

    currentY += 30;

    // Notes section
    if (bon.notes || true) { // Always show notes section
      currentY += 5;
      pdf.setFontSize(10);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Notes', margin, currentY);
      currentY += 6;

      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      const notesText = bon.notes || 'Livraison prioritaire - Contacter le client avant livraison';
      const notesLines = pdf.splitTextToSize(notesText, contentWidth);
      pdf.text(notesLines, margin, currentY);
      currentY += notesLines.length * 4;
    }

    // Footer
    currentY += 10;
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Document généré le ${formatDate(new Date().toISOString())} par LogiTrack`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    pdf.text(`Total des colis: ${sampleColis.length} | Montant total: ${totalGeneral.toFixed(2)} DH`, pageWidth / 2, currentY, { align: 'center' });

    // Generate filename and save
    const filename = `Bon_Distribution_Mobile_${bon.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);

  } catch (error) {
    console.error('Error generating mobile PDF:', error);
    throw new Error('Erreur lors de la génération du PDF mobile');
  }
};

// Download bon as Excel file
export const downloadBonAsExcel = async (bon: Bon): Promise<void> => {
  try {
    // Helper function for date formatting
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    // Sample colis data (same as used in PDF generation)
    const sampleColis = [
      {
        id: 'COL-2025-0001',
        reference: 'REF-001',
        nom: 'Smartphone Samsung Galaxy',
        prix: 2500.00,
        frais: 25.00,
        statut: 'en cours',
        client: { nom: 'Ahmed Benali', telephone: '+212 6 12 34 56 78' },
        adresse_livraison: '123 Rue Mohammed V, Casablanca'
      },
      {
        id: 'COL-2025-0002',
        reference: 'REF-002',
        nom: 'Ordinateur portable HP',
        prix: 4200.00,
        frais: 35.00,
        statut: 'en cours',
        client: { nom: 'Fatima Alaoui', telephone: '+212 6 98 76 54 32' },
        adresse_livraison: '456 Avenue Hassan II, Rabat'
      },
      {
        id: 'COL-2025-0003',
        reference: 'REF-003',
        nom: 'Tablette iPad Air',
        prix: 3200.00,
        frais: 30.00,
        statut: 'en cours',
        client: { nom: 'Omar Tazi', telephone: '+212 6 11 22 33 44' },
        adresse_livraison: '789 Boulevard Zerktouni, Casablanca'
      },
      {
        id: 'COL-2025-0004',
        reference: 'REF-004',
        nom: 'Montre connectée Apple Watch',
        prix: 1800.00,
        frais: 20.00,
        statut: 'en cours',
        client: { nom: 'Aicha Bennani', telephone: '+212 6 55 66 77 88' },
        adresse_livraison: '321 Rue Allal Ben Abdellah, Fès'
      }
    ];

    // Calculate totals
    const totalPrix = sampleColis.reduce((sum, colis) => sum + colis.prix, 0);
    const totalFrais = sampleColis.reduce((sum, colis) => sum + colis.frais, 0);
    const totalGeneral = totalPrix + totalFrais;

    // Create workbook with single sheet
    const workbook = XLSX.utils.book_new();

    // Create single sheet data with bon details at top and colis table below
    const sheetData = [];

    // 1. Header section - Bon de Distribution
    sheetData.push(['BON DE DISTRIBUTION', '', '', '', '', '', '', '', '', '']);
    sheetData.push(['', '', '', '', '', '', '', '', '', '']);

    // 2. Bon information section
    sheetData.push(['INFORMATIONS GÉNÉRALES', '', '', '', '', '', '', '', '', '']);
    sheetData.push(['', '', '', '', '', '', '', '', '', '']);
    sheetData.push(['ID Bon:', bon.id, '', '', 'Type:', 'Distribution', '', '', '', '']);
    sheetData.push(['Date de création:', formatDate(bon.date_creation), '', '', 'Statut:', bon.statut, '', '', '', '']);
    sheetData.push(['Livreur:', bon.user ? `${bon.user.nom} ${bon.user.prenom || ''}`.trim() : 'N/A', '', '', 'Zone:', bon.user?.zone || 'N/A', '', '', '', '']);
    sheetData.push(['Email:', bon.user?.email || 'N/A', '', '', 'Téléphone:', bon.user?.telephone || 'N/A', '', '', '', '']);
    sheetData.push(['Véhicule:', bon.user?.vehicule || 'N/A', '', '', 'Nombre de colis:', bon.nb_colis || sampleColis.length, '', '', '', '']);
    sheetData.push(['', '', '', '', '', '', '', '', '', '']);
    sheetData.push(['Notes:', bon.notes || 'Aucune note', '', '', '', '', '', '', '', '']);
    sheetData.push(['', '', '', '', '', '', '', '', '', '']);
    sheetData.push(['', '', '', '', '', '', '', '', '', '']);

    // 3. Colis table section
    sheetData.push(['LISTE DES COLIS', '', '', '', '', '', '', '', '', '']);
    sheetData.push(['', '', '', '', '', '', '', '', '', '']);

    // Table headers
    sheetData.push([
      'Référence',
      'Nom du produit',
      'Client',
      'Téléphone',
      'Adresse de livraison',
      'Frais (DH)',
      'Prix (DH)',
      'Total (DH)',
      'Statut',
      'Zone'
    ]);

    // Table data
    sampleColis.forEach(colis => {
      sheetData.push([
        colis.reference,
        colis.nom,
        colis.client.nom,
        colis.client.telephone,
        colis.adresse_livraison,
        colis.frais.toFixed(2),
        colis.prix.toFixed(2),
        (colis.prix + colis.frais).toFixed(2),
        colis.statut,
        bon.user?.zone || 'N/A'
      ]);
    });

    // Add summary section
    sheetData.push(['', '', '', '', '', '', '', '', '', '']);
    sheetData.push(['RÉSUMÉ', '', '', '', '', '', '', '', '', '']);
    sheetData.push(['Total Frais:', totalFrais.toFixed(2) + ' DH', '', '', '', '', '', '', '', '']);
    sheetData.push(['Total Prix:', totalPrix.toFixed(2) + ' DH', '', '', '', '', '', '', '', '']);
    sheetData.push(['TOTAL GÉNÉRAL:', totalGeneral.toFixed(2) + ' DH', '', '', '', '', '', '', '', '']);
    sheetData.push(['Nombre de colis:', sampleColis.length.toString(), '', '', '', '', '', '', '', '']);

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Set column widths
    worksheet['!cols'] = [
      { width: 15 }, // Référence
      { width: 30 }, // Nom du produit
      { width: 20 }, // Client
      { width: 18 }, // Téléphone
      { width: 40 }, // Adresse
      { width: 12 }, // Frais
      { width: 12 }, // Prix
      { width: 12 }, // Total
      { width: 12 }, // Statut
      { width: 15 }  // Zone
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bon de Distribution');

    // Generate filename and download
    const filename = `Bon_Distribution_${bon.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);

  } catch (error) {
    console.error('Error generating Excel file:', error);
    throw new Error('Erreur lors de la génération du fichier Excel');
  }
};
