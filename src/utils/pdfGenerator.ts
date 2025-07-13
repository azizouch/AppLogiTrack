import { Bon } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';

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
    <div style="font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 15px; background: white; font-size: 14px; line-height: 1.4;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid #2563eb; padding-bottom: 15px;">
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 8px; margin-top: 0; font-weight: bold;">BON DE DISTRIBUTION</h1>
        <p style="color: #666; font-size: 16px; margin: 0;">LogiTrack - Système de gestion logistique</p>
      </div>

      <!-- Bon Info -->
      <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px;">
        <div style="flex: 1; background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
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
        <div style="flex: 1; background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
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
      <div style="margin: 20px 0;">
        <h3 style="color: #2563eb; margin-bottom: 15px; font-size: 18px; font-weight: bold;">Liste des Colis (${sampleColis.length} colis)</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <thead>
            <tr style="background: #2563eb; color: white;">
              <th style="padding: 10px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase;">Référence</th>
              <th style="padding: 10px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase;">Client</th>
              <th style="padding: 10px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase;">Entreprise</th>
              <th style="padding: 10px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase;">Adresse</th>
              <th style="padding: 10px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase;">Prix (DH)</th>
              <th style="padding: 10px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase;">Frais (DH)</th>
            </tr>
          </thead>
          <tbody>
            ${sampleColis.map((colis, index) => `
              <tr style="background: ${index % 2 === 0 ? 'white' : '#f8fafc'};">
                <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; font-size: 12px;"><strong>${colis.reference}</strong></td>
                <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${colis.client}</td>
                <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${colis.entreprise}</td>
                <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${colis.adresse}</td>
                <td class="price-cell" style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; font-weight: 600; color: #059669; white-space: nowrap;">${colis.prix.toFixed(2)} DH</td>
                <td class="price-cell" style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; font-weight: 600; color: #059669; white-space: nowrap;">${colis.frais.toFixed(2)} DH</td>
              </tr>
            `).join('')}
            <tr style="background: #f1f5f9; font-weight: 600; border-top: 2px solid #2563eb;">
              <td colspan="3" style="padding: 10px 8px; font-size: 14px;"><strong>TOTAL</strong></td>
              <td colspan="2" class="price-cell" style="padding: 10px 8px; font-size: 14px; text-align: right; white-space: nowrap;"><strong>${totalPrix.toFixed(2)} DH</strong></td>
              <td class="price-cell" style="padding: 10px 8px; font-size: 14px; text-align: right; white-space: nowrap;"><strong>${totalFrais.toFixed(2)} DH</strong></td>
            </tr>
            <tr style="background: #f1f5f9; font-weight: 600; border-top: 2px solid #2563eb;">
              <td colspan="4" style="padding: 10px 8px; font-size: 14px;"><strong>TOTAL GÉNÉRAL</strong></td>
              <td colspan="2" class="price-cell" style="padding: 10px 8px; font-size: 14px; text-align: right; white-space: nowrap;"><strong>${totalGeneral.toFixed(2)} DH</strong></td>
            </tr>
          </tbody>
        </table>
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

// Download bon as PDF file directly to Downloads folder
export const downloadBonAsPDF = async (bon: Bon): Promise<void> => {
  try {
    // Create a temporary container to render the HTML with high quality settings
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '1000px'; // Larger width for better quality
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '30px';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.fontSize = '14px'; // Slightly larger font
    tempContainer.style.lineHeight = '1.5';

    // Generate the content for PDF
    const pdfContent = generatePDFContent(bon);
    tempContainer.innerHTML = pdfContent;

    document.body.appendChild(tempContainer);

    // Wait a moment for rendering
    await new Promise(resolve => setTimeout(resolve, 100));

    // Convert HTML to canvas with high quality settings for desktop
    const canvas = await html2canvas(tempContainer, {
      scale: 3, // Higher scale for better quality on desktop
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 1000, // Match container width
      height: tempContainer.scrollHeight,
      logging: false,
      imageTimeout: 0,
      removeContainer: true
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add image to PDF with maximum quality
    const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // Generate filename
    const filename = `Bon_Distribution_${bon.id}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Download the PDF
    pdf.save(filename);

    // Show mobile viewing tip if on mobile device
    if (isMobile()) {
      setTimeout(() => {
        alert('Conseil: Pour une meilleure visualisation sur mobile, ouvrez le PDF avec une application PDF dédiée ou utilisez le mode paysage de votre appareil.');
      }, 1000);
    }

    // Clean up
    document.body.removeChild(tempContainer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Erreur lors de la génération du PDF');
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
    }
  ];

  const totalPrix = sampleColis.reduce((sum, colis) => sum + colis.prix, 0);
  const totalFrais = sampleColis.reduce((sum, colis) => sum + colis.frais, 0);
  const totalGeneral = totalPrix + totalFrais;

  return `
    <div style="font-family: Arial, sans-serif; width: 100%; margin: 0; padding: 5px; background: white; font-size: 12px; line-height: 1.2;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 12px; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">
        <h1 style="color: #2563eb; font-size: 16px; margin-bottom: 3px; margin-top: 0; font-weight: bold;">BON DE DISTRIBUTION</h1>
        <p style="color: #666; font-size: 10px; margin: 0;">LogiTrack - Système de gestion logistique</p>
      </div>

      <!-- Bon Info - Compact but full width -->
      <div style="margin-bottom: 10px;">
        <div style="background: #f8fafc; padding: 8px; border-radius: 4px; border-left: 3px solid #2563eb; margin-bottom: 6px;">
          <h3 style="color: #2563eb; margin-bottom: 6px; font-size: 13px; margin-top: 0; font-weight: bold;">Informations générales</h3>
          <div style="margin-bottom: 4px; font-size: 11px;">
            <strong style="color: #475569;">ID:</strong>
            <span style="color: #1e293b; margin-left: 3px;">${bon.id}</span>
          </div>
          <div style="margin-bottom: 4px; font-size: 11px;">
            <strong style="color: #475569;">Type:</strong>
            <span style="color: #1e293b; margin-left: 3px;">${bon.type.charAt(0).toUpperCase() + bon.type.slice(1)}</span>
          </div>
          <div style="margin-bottom: 4px; font-size: 11px;">
            <strong style="color: #475569;">Statut:</strong>
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; background: #dbeafe; color: #1e40af; margin-left: 3px;">${getStatusText(bon.statut)}</span>
          </div>
          <div style="margin-bottom: 4px; font-size: 11px;">
            <strong style="color: #475569;">Date:</strong>
            <span style="color: #1e293b; margin-left: 3px;">${formatDate(bon.date_creation)}</span>
          </div>
          ${bon.nb_colis ? `
          <div style="font-size: 11px;">
            <strong style="color: #475569;">Colis:</strong>
            <span style="color: #1e293b; margin-left: 3px;">${bon.nb_colis}</span>
          </div>
          ` : ''}
        </div>

        ${bon.user ? `
        <div style="background: #f8fafc; padding: 8px; border-radius: 4px; border-left: 3px solid #2563eb;">
          <h3 style="color: #2563eb; margin-bottom: 6px; font-size: 13px; margin-top: 0; font-weight: bold;">Livreur assigné</h3>
          <div style="margin-bottom: 4px; font-size: 11px;">
            <strong style="color: #475569;">Nom:</strong>
            <span style="color: #1e293b; margin-left: 3px;">${bon.user.nom} ${bon.user.prenom || ''}</span>
          </div>
          ${bon.user.email ? `
          <div style="margin-bottom: 4px; font-size: 11px;">
            <strong style="color: #475569;">Email:</strong>
            <span style="color: #1e293b; margin-left: 3px;">${bon.user.email}</span>
          </div>
          ` : ''}
          ${bon.user.telephone ? `
          <div style="margin-bottom: 4px; font-size: 11px;">
            <strong style="color: #475569;">Tél:</strong>
            <span style="color: #1e293b; margin-left: 3px;">${bon.user.telephone}</span>
          </div>
          ` : ''}
          ${bon.user.vehicule ? `
          <div style="margin-bottom: 4px; font-size: 11px;">
            <strong style="color: #475569;">Véhicule:</strong>
            <span style="color: #1e293b; margin-left: 3px;">${bon.user.vehicule}</span>
          </div>
          ` : ''}
          ${bon.user.zone ? `
          <div style="font-size: 11px;">
            <strong style="color: #475569;">Zone:</strong>
            <span style="color: #1e293b; margin-left: 3px;">${bon.user.zone}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>

      <!-- Colis List - Compact but full width -->
      <div style="margin: 10px 0;">
        <h3 style="color: #2563eb; margin-bottom: 8px; font-size: 13px; font-weight: bold;">Liste des Colis (${sampleColis.length} colis)</h3>

        ${sampleColis.map((colis, index) => `
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; margin-bottom: 4px;">
            <div style="margin-bottom: 3px; font-size: 10px;">
              <strong style="color: #2563eb;">Réf:</strong>
              <span style="color: #1e293b; font-weight: 600; margin-left: 3px;">${colis.reference}</span>
            </div>
            <div style="margin-bottom: 3px; font-size: 10px;">
              <strong style="color: #475569;">Client:</strong>
              <span style="color: #1e293b; margin-left: 3px;">${colis.client}</span>
            </div>
            <div style="margin-bottom: 3px; font-size: 10px;">
              <strong style="color: #475569;">Entreprise:</strong>
              <span style="color: #1e293b; margin-left: 3px;">${colis.entreprise}</span>
            </div>
            <div style="margin-bottom: 3px; font-size: 10px;">
              <strong style="color: #475569;">Adresse:</strong>
              <span style="color: #1e293b; margin-left: 3px;">${colis.adresse}</span>
            </div>
            <div style="font-size: 10px;">
              <strong style="color: #059669;">Prix:</strong>
              <span style="color: #059669; font-weight: 600; margin-left: 3px;">${colis.prix.toFixed(2)} DH</span>
              <strong style="color: #059669; margin-left: 10px;">Frais:</strong>
              <span style="color: #059669; font-weight: 600; margin-left: 3px;">${colis.frais.toFixed(2)} DH</span>
            </div>
          </div>
        `).join('')}

        <!-- Totals -->
        <div style="background: #f1f5f9; border: 2px solid #2563eb; border-radius: 4px; padding: 8px; margin-top: 8px;">
          <div style="margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid #cbd5e1; font-size: 11px;">
            <strong style="color: #2563eb;">TOTAL PRIX:</strong>
            <span style="color: #059669; font-weight: 700; float: right;">${totalPrix.toFixed(2)} DH</span>
          </div>
          <div style="margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid #cbd5e1; font-size: 11px;">
            <strong style="color: #2563eb;">TOTAL FRAIS:</strong>
            <span style="color: #059669; font-weight: 700; float: right;">${totalFrais.toFixed(2)} DH</span>
          </div>
          <div style="font-size: 12px;">
            <strong style="color: #2563eb;">TOTAL GÉNÉRAL:</strong>
            <span style="color: #059669; font-weight: 700; float: right;">${totalGeneral.toFixed(2)} DH</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div style="margin-top: 8px; padding: 6px; background: #f8fafc; border-radius: 4px; border-left: 3px solid #2563eb;">
        <h4 style="color: #2563eb; margin-bottom: 3px; font-size: 11px; margin-top: 0;">Notes</h4>
        <p style="color: #475569; margin: 0; font-size: 10px; line-height: 1.2;">
          Livraison prioritaire - Contacter le client avant livraison
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 9px;">
        <p style="margin: 0;">Document généré le ${formatDate(new Date().toISOString())} par LogiTrack</p>
        <p style="margin: 2px 0 0 0;">Total des colis: ${sampleColis.length} | Montant total: ${totalGeneral.toFixed(2)} DH</p>
      </div>
    </div>
  `;
};

// Download mobile-optimized PDF (same content as print/download but optimized for mobile viewing)
export const downloadMobileBonAsPDF = async (bon: Bon): Promise<void> => {
  try {
    // Create a temporary container optimized for mobile PDF
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '210mm'; // Use A4 width directly for full page utilization
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '5mm'; // Minimal padding in mm
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.fontSize = '12px'; // Smaller font for mobile
    tempContainer.style.lineHeight = '1.2'; // Tighter line height
    tempContainer.style.boxSizing = 'border-box';

    // Generate mobile-optimized content
    const pdfContent = generateMobilePDFContent(bon);
    tempContainer.innerHTML = pdfContent;

    document.body.appendChild(tempContainer);

    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 200));

    // Convert to canvas optimized for mobile PDF with full width
    const canvas = await html2canvas(tempContainer, {
      scale: 1, // Use 1:1 scale for full width utilization
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: tempContainer.offsetWidth, // Use actual container width
      height: tempContainer.scrollHeight,
      logging: false,
      imageTimeout: 0,
      removeContainer: true
    });

    // Create PDF optimized for full width mobile viewing
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    const margin = 0; // No margin for maximum width utilization
    const contentWidth = pdfWidth; // Use full page width
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    // Add image to PDF with full width utilization
    const imageData = canvas.toDataURL('image/png', 1.0); // Maximum quality

    // Use full page width and height for maximum utilization
    pdf.addImage(imageData, 'PNG', margin, margin, contentWidth, contentHeight, undefined, 'FAST');

    // Handle multi-page content if needed
    let remainingHeight = contentHeight - pdfHeight;

    while (remainingHeight > 0) {
      pdf.addPage();
      const yOffset = -(contentHeight - remainingHeight);
      pdf.addImage(imageData, 'PNG', margin, yOffset, contentWidth, contentHeight, undefined, 'FAST');
      remainingHeight -= pdfHeight;
    }

    // Generate filename
    const filename = `Bon_Distribution_Mobile_${bon.id}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Download the PDF
    pdf.save(filename);

    // Clean up
    document.body.removeChild(tempContainer);

  } catch (error) {
    console.error('Error generating mobile PDF:', error);
    throw new Error('Erreur lors de la génération du PDF mobile');
  }
};

// New mobile PDF generator using html2pdf.js for better mobile support
export const downloadMobileBonAsPDFNew = async (bon: Bon): Promise<void> => {
  try {
    // Create a temporary container for the PDF content
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '800px'; // Fixed width
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.fontSize = '14px';
    tempContainer.style.lineHeight = '1.4';
    tempContainer.style.padding = '15px';
    tempContainer.style.boxSizing = 'border-box';

    // Generate optimized mobile content
    const pdfContent = generateOptimizedMobilePDFContent(bon);
    console.log('Generated PDF content length:', pdfContent.length);
    tempContainer.innerHTML = pdfContent;

    document.body.appendChild(tempContainer);
    console.log('Container height:', tempContainer.scrollHeight);

    // Wait longer for content to render
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simplified html2pdf options
    const options = {
      margin: 10, // 10mm margin on all sides
      filename: `Bon_Distribution_Mobile_${bon.id}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      }
    };

    // Generate and download PDF using html2pdf
    await html2pdf().set(options).from(tempContainer).save();

    // Clean up
    document.body.removeChild(tempContainer);

  } catch (error) {
    console.error('Error generating mobile PDF with html2pdf:', error);
    // Fallback to the original mobile PDF generator
    console.log('Falling back to original mobile PDF generator...');
    throw error; // Re-throw to show the actual error
  }
};

// Alternative simple mobile PDF generator using html2pdf.js
export const downloadMobileBonAsPDFSimple = async (bon: Bon): Promise<void> => {
  try {
    // Create simple HTML content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; font-size: 14px;">
        <h1 style="text-align: center; color: #2563eb;">BON DE DISTRIBUTION</h1>
        <p style="text-align: center; color: #666;">LogiTrack - Système de gestion logistique</p>

        <div style="margin: 20px 0;">
          <h3>Informations générales</h3>
          <p><strong>ID Bon:</strong> ${bon.id}</p>
          <p><strong>Type:</strong> ${bon.type}</p>
          <p><strong>Statut:</strong> ${bon.statut}</p>
          <p><strong>Date:</strong> ${new Date(bon.date_creation).toLocaleDateString('fr-FR')}</p>
        </div>

        ${bon.user ? `
        <div style="margin: 20px 0;">
          <h3>Livreur assigné</h3>
          <p><strong>Nom:</strong> ${bon.user.nom} ${bon.user.prenom || ''}</p>
          ${bon.user.email ? `<p><strong>Email:</strong> ${bon.user.email}</p>` : ''}
          ${bon.user.telephone ? `<p><strong>Téléphone:</strong> ${bon.user.telephone}</p>` : ''}
        </div>
        ` : ''}

        <div style="margin: 20px 0;">
          <h3>Colis</h3>
          <p>Exemple de colis pour démonstration</p>
        </div>
      </div>
    `;

    // Use html2pdf with simple configuration
    const options = {
      margin: 10,
      filename: `Bon_${bon.id}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Create element from HTML string
    const element = document.createElement('div');
    element.innerHTML = htmlContent;

    await html2pdf().set(options).from(element).save();

  } catch (error) {
    console.error('Error generating simple mobile PDF:', error);
    throw error;
  }
};

// Generate optimized mobile PDF content for html2pdf.js
const generateOptimizedMobilePDFContent = (bon: Bon): string => {
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
    <div style="font-family: Arial, sans-serif; width: 100%; margin: 0; padding: 10px; background: white; font-size: 14px; line-height: 1.4; color: #333;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 15px;">
        <h1 style="color: #2563eb; font-size: 22px; margin: 0 0 8px 0; font-weight: bold;">BON DE DISTRIBUTION</h1>
        <p style="color: #666; font-size: 14px; margin: 0;">LogiTrack - Système de gestion logistique</p>
      </div>

      <!-- Bon Info -->
      <div style="margin-bottom: 20px;">
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 15px;">
          <h3 style="color: #2563eb; margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Informations générales</h3>
          <div style="margin-bottom: 8px;"><strong>ID Bon:</strong> ${bon.id}</div>
          <div style="margin-bottom: 8px;"><strong>Type:</strong> ${bon.type.charAt(0).toUpperCase() + bon.type.slice(1)}</div>
          <div style="margin-bottom: 8px;"><strong>Statut:</strong> <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">${getStatusText(bon.statut)}</span></div>
          <div style="margin-bottom: 8px;"><strong>Date de création:</strong> ${formatDate(bon.date_creation)}</div>
          ${bon.nb_colis ? `<div><strong>Nombre de colis:</strong> ${bon.nb_colis}</div>` : ''}
        </div>

        ${bon.user ? `
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <h3 style="color: #2563eb; margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Livreur assigné</h3>
          <div style="margin-bottom: 8px;"><strong>Nom:</strong> ${bon.user.nom} ${bon.user.prenom || ''}</div>
          ${bon.user.email ? `<div style="margin-bottom: 8px;"><strong>Email:</strong> ${bon.user.email}</div>` : ''}
          ${bon.user.telephone ? `<div style="margin-bottom: 8px;"><strong>Téléphone:</strong> ${bon.user.telephone}</div>` : ''}
          ${bon.user.vehicule ? `<div style="margin-bottom: 8px;"><strong>Véhicule:</strong> ${bon.user.vehicule}</div>` : ''}
          ${bon.user.zone ? `<div><strong>Zone:</strong> ${bon.user.zone}</div>` : ''}
        </div>
        ` : ''}
      </div>

      <!-- Colis List -->
      <div style="margin-bottom: 20px;">
        <h3 style="color: #2563eb; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">Liste des Colis (${sampleColis.length} colis)</h3>

        ${sampleColis.map((colis) => `
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
            <div style="margin-bottom: 6px;"><strong style="color: #2563eb;">Référence:</strong> ${colis.reference}</div>
            <div style="margin-bottom: 6px;"><strong>Client:</strong> ${colis.client}</div>
            <div style="margin-bottom: 6px;"><strong>Entreprise:</strong> ${colis.entreprise}</div>
            <div style="margin-bottom: 6px;"><strong>Adresse:</strong> ${colis.adresse}</div>
            <div style="margin-bottom: 6px;"><strong style="color: #059669;">Prix:</strong> ${colis.prix.toFixed(2)} DH</div>
            <div><strong style="color: #059669;">Frais:</strong> ${colis.frais.toFixed(2)} DH</div>
          </div>
        `).join('')}
      </div>

      <!-- Totals -->
      <div style="background: #f1f5f9; border: 2px solid #2563eb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #cbd5e1;">
          <strong style="color: #2563eb;">TOTAL PRIX:</strong>
          <span style="color: #059669; font-weight: bold; float: right;">${totalPrix.toFixed(2)} DH</span>
        </div>
        <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #cbd5e1;">
          <strong style="color: #2563eb;">TOTAL FRAIS:</strong>
          <span style="color: #059669; font-weight: bold; float: right;">${totalFrais.toFixed(2)} DH</span>
        </div>
        <div>
          <strong style="color: #2563eb; font-size: 16px;">TOTAL GÉNÉRAL:</strong>
          <span style="color: #059669; font-weight: bold; font-size: 16px; float: right;">${totalGeneral.toFixed(2)} DH</span>
        </div>
      </div>

      <!-- Notes -->
      <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 20px;">
        <h4 style="color: #2563eb; margin: 0 0 8px 0; font-size: 14px;">Notes</h4>
        <p style="color: #475569; margin: 0; font-size: 12px;">
          Livraison prioritaire - Contacter le client avant livraison
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding-top: 15px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
        <p style="margin: 0;">Document généré le ${formatDate(new Date().toISOString())} par LogiTrack</p>
        <p style="margin: 5px 0 0 0;">Total des colis: ${sampleColis.length} | Montant total: ${totalGeneral.toFixed(2)} DH</p>
      </div>
    </div>
  `;
};

// Generate HTML content for the bon
const generateBonHTML = (bon: Bon): string => {
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

  // Sample colis data for demonstration
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
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bon de Distribution #${bon.id}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        
        .header h1 {
          color: #2563eb;
          font-size: 28px;
          margin-bottom: 10px;
        }
        
        .header p {
          color: #666;
          font-size: 16px;
        }
        
        .bon-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .info-section {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }
        
        .info-section h3 {
          color: #2563eb;
          margin-bottom: 15px;
          font-size: 18px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 5px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-label {
          font-weight: 600;
          color: #475569;
        }
        
        .info-value {
          color: #1e293b;
        }
        
        .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status.en-cours {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .status.complete {
          background: #dcfce7;
          color: #166534;
        }
        
        .status.annule {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .colis-section {
          margin: 30px 0;
        }
        
        .colis-section h3 {
          color: #2563eb;
          margin-bottom: 15px;
          font-size: 18px;
        }
        
        .colis-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .colis-table th {
          background: #2563eb;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
        }

        .colis-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
          vertical-align: top;
        }

        .colis-table tr:last-child td {
          border-bottom: none;
        }

        .colis-table tr:nth-child(even) {
          background: #f8fafc;
        }

        .price-cell {
          text-align: right;
          font-weight: 600;
          color: #059669;
        }

        .total-row {
          background: #f1f5f9 !important;
          font-weight: 600;
          border-top: 2px solid #2563eb;
        }

        .total-row td {
          padding: 12px 8px;
          font-size: 12px;
        }

        .notes-section {
          margin-top: 30px;
          padding: 20px;
          background: #f1f5f9;
          border-radius: 8px;
        }

        .notes-section h3 {
          color: #2563eb;
          margin-bottom: 10px;
        }

        .footer {
          margin-top: 40px;
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 14px;
        }

        @media print {
          body {
            margin: 0;
            padding: 15px;
          }

          .header {
            margin-bottom: 20px;
          }

          .bon-info {
            margin-bottom: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BON DE DISTRIBUTION</h1>
        <p>LogiTrack - Système de gestion logistique</p>
      </div>

      <div class="bon-info">
        <div class="info-section">
          <h3>Informations générales</h3>
          <div class="info-row">
            <span class="info-label">ID Bon:</span>
            <span class="info-value">${bon.id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Type:</span>
            <span class="info-value">${bon.type.charAt(0).toUpperCase() + bon.type.slice(1)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Statut:</span>
            <span class="info-value">
              <span class="status ${bon.statut.toLowerCase().replace('é', 'e').replace(' ', '-')}">${getStatusText(bon.statut)}</span>
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Date de création:</span>
            <span class="info-value">${formatDate(bon.date_creation)}</span>
          </div>
          ${bon.nb_colis ? `
          <div class="info-row">
            <span class="info-label">Nombre de colis:</span>
            <span class="info-value">${bon.nb_colis} colis</span>
          </div>
          ` : ''}
        </div>

        ${bon.user ? `
        <div class="info-section">
          <h3>Livreur assigné</h3>
          <div class="info-row">
            <span class="info-label">Nom:</span>
            <span class="info-value">${bon.user.nom} ${bon.user.prenom || ''}</span>
          </div>
          ${bon.user.email ? `
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${bon.user.email}</span>
          </div>
          ` : ''}
          ${bon.user.telephone ? `
          <div class="info-row">
            <span class="info-label">Téléphone:</span>
            <span class="info-value">${bon.user.telephone}</span>
          </div>
          ` : ''}
          ${bon.user.vehicule ? `
          <div class="info-row">
            <span class="info-label">Véhicule:</span>
            <span class="info-value">${bon.user.vehicule}</span>
          </div>
          ` : ''}
          ${bon.user.zone ? `
          <div class="info-row">
            <span class="info-label">Zone:</span>
            <span class="info-value">${bon.user.zone}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>

      <!-- Colis Table -->
      <div class="colis-section">
        <h3>Liste des Colis (${sampleColis.length} colis)</h3>
        <table class="colis-table">
          <thead>
            <tr>
              <th style="width: 15%;">Référence</th>
              <th style="width: 20%;">Client</th>
              <th style="width: 20%;">Entreprise</th>
              <th style="width: 25%;">Adresse de livraison</th>
              <th style="width: 10%;">Prix (DH)</th>
              <th style="width: 10%;">Frais (DH)</th>
            </tr>
          </thead>
          <tbody>
            ${sampleColis.map(colis => `
              <tr>
                <td><strong>${colis.reference}</strong></td>
                <td>${colis.client}</td>
                <td>${colis.entreprise}</td>
                <td>${colis.adresse}</td>
                <td class="price-cell">${colis.prix.toFixed(2)}</td>
                <td class="price-cell">${colis.frais.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4"><strong>TOTAL</strong></td>
              <td class="price-cell"><strong>${totalPrix.toFixed(2)} DH</strong></td>
              <td class="price-cell"><strong>${totalFrais.toFixed(2)} DH</strong></td>
            </tr>
            <tr class="total-row">
              <td colspan="5"><strong>TOTAL GÉNÉRAL</strong></td>
              <td class="price-cell"><strong>${totalGeneral.toFixed(2)} DH</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      ${bon.notes ? `
      <div class="notes-section">
        <h3>Notes</h3>
        <p>${bon.notes}</p>
      </div>
      ` : ''}

      <div class="footer">
        <p>Document généré le ${formatDate(new Date().toISOString())} par LogiTrack</p>
        <p><strong>Total des colis: ${sampleColis.length} | Montant total: ${totalGeneral.toFixed(2)} DH</strong></p>
      </div>
    </body>
    </html>
  `;
};
