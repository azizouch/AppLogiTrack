import { Bon } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Print bon - opens print dialog (like the screenshot)
export const printBon = async (bon: Bon): Promise<void> => {
  const htmlContent = generateBonHTML(bon);

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
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;">
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px; margin-top: 0;">BON DE DISTRIBUTION</h1>
        <p style="color: #666; font-size: 16px; margin: 0;">LogiTrack - Système de gestion logistique</p>
      </div>

      <!-- Bon Info -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <h3 style="color: #2563eb; margin-bottom: 15px; font-size: 18px; margin-top: 0;">Informations générales</h3>
          <div style="margin-bottom: 10px;">
            <strong style="color: #475569;">ID Bon:</strong> <span style="color: #1e293b;">${bon.id}</span>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color: #475569;">Type:</strong> <span style="color: #1e293b;">${bon.type.charAt(0).toUpperCase() + bon.type.slice(1)}</span>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color: #475569;">Statut:</strong>
            <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; background: #dbeafe; color: #1e40af;">${getStatusText(bon.statut)}</span>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color: #475569;">Date de création:</strong> <span style="color: #1e293b;">${formatDate(bon.date_creation)}</span>
          </div>
          ${bon.nb_colis ? `
          <div style="margin-bottom: 10px;">
            <strong style="color: #475569;">Nombre de colis:</strong> <span style="color: #1e293b;">${bon.nb_colis} colis</span>
          </div>
          ` : ''}
        </div>

        ${bon.user ? `
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <h3 style="color: #2563eb; margin-bottom: 15px; font-size: 18px; margin-top: 0;">Livreur assigné</h3>
          <div style="margin-bottom: 10px;">
            <strong style="color: #475569;">Nom:</strong> <span style="color: #1e293b;">${bon.user.nom} ${bon.user.prenom || ''}</span>
          </div>
          ${bon.user.email ? `
          <div style="margin-bottom: 10px;">
            <strong style="color: #475569;">Email:</strong> <span style="color: #1e293b;">${bon.user.email}</span>
          </div>
          ` : ''}
          ${bon.user.telephone ? `
          <div style="margin-bottom: 10px;">
            <strong style="color: #475569;">Téléphone:</strong> <span style="color: #1e293b;">${bon.user.telephone}</span>
          </div>
          ` : ''}
          ${bon.user.vehicule ? `
          <div style="margin-bottom: 10px;">
            <strong style="color: #475569;">Véhicule:</strong> <span style="color: #1e293b;">${bon.user.vehicule}</span>
          </div>
          ` : ''}
          ${bon.user.zone ? `
          <div style="margin-bottom: 10px;">
            <strong style="color: #475569;">Zone:</strong> <span style="color: #1e293b;">${bon.user.zone}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>

      <!-- Colis Table -->
      <div style="margin: 30px 0;">
        <h3 style="color: #2563eb; margin-bottom: 15px; font-size: 18px;">Liste des Colis (${sampleColis.length} colis)</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <thead>
            <tr style="background: #2563eb; color: white;">
              <th style="padding: 12px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase;">Référence</th>
              <th style="padding: 12px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase;">Client</th>
              <th style="padding: 12px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase;">Entreprise</th>
              <th style="padding: 12px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase;">Adresse</th>
              <th style="padding: 12px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase;">Prix (DH)</th>
              <th style="padding: 12px 8px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase;">Frais (DH)</th>
            </tr>
          </thead>
          <tbody>
            ${sampleColis.map((colis, index) => `
              <tr style="background: ${index % 2 === 0 ? 'white' : '#f8fafc'};">
                <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;"><strong>${colis.reference}</strong></td>
                <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${colis.client}</td>
                <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${colis.entreprise}</td>
                <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${colis.adresse}</td>
                <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: 600; color: #059669;">${colis.prix.toFixed(2)}</td>
                <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: 600; color: #059669;">${colis.frais.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr style="background: #f1f5f9; font-weight: 600; border-top: 2px solid #2563eb;">
              <td colspan="4" style="padding: 12px 8px; font-size: 12px;"><strong>TOTAL</strong></td>
              <td style="padding: 12px 8px; font-size: 12px; text-align: right;"><strong>${totalPrix.toFixed(2)} DH</strong></td>
              <td style="padding: 12px 8px; font-size: 12px; text-align: right;"><strong>${totalFrais.toFixed(2)} DH</strong></td>
            </tr>
            <tr style="background: #f1f5f9; font-weight: 600; border-top: 2px solid #2563eb;">
              <td colspan="5" style="padding: 12px 8px; font-size: 12px;"><strong>TOTAL GÉNÉRAL</strong></td>
              <td style="padding: 12px 8px; font-size: 12px; text-align: right;"><strong>${totalGeneral.toFixed(2)} DH</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      ${bon.notes ? `
      <div style="margin-top: 30px; padding: 20px; background: #f1f5f9; border-radius: 8px;">
        <h3 style="color: #2563eb; margin-bottom: 10px; margin-top: 0;">Notes</h3>
        <p style="margin: 0;">${bon.notes}</p>
      </div>
      ` : ''}

      <div style="margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
        <p style="margin: 0 0 10px 0;">Document généré le ${formatDate(new Date().toISOString())} par LogiTrack</p>
        <p style="margin: 0;"><strong>Total des colis: ${sampleColis.length} | Montant total: ${totalGeneral.toFixed(2)} DH</strong></p>
      </div>
    </div>
  `;
};

// Download bon as PDF file directly to Downloads folder
export const downloadBonAsPDF = async (bon: Bon): Promise<void> => {
  try {
    // Create a temporary container to render the HTML
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '800px';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '20px';
    tempContainer.style.fontFamily = 'Arial, sans-serif';

    // Generate the content for PDF
    const pdfContent = generatePDFContent(bon);
    tempContainer.innerHTML = pdfContent;

    document.body.appendChild(tempContainer);

    // Wait a moment for rendering
    await new Promise(resolve => setTimeout(resolve, 100));

    // Convert HTML to canvas
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800,
      height: tempContainer.scrollHeight
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate filename
    const filename = `Bon_Distribution_${bon.id}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Download the PDF
    pdf.save(filename);

    // Clean up
    document.body.removeChild(tempContainer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Erreur lors de la génération du PDF');
  }
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
