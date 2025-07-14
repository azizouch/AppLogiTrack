import { Bon } from '@/types';
import jsPDF from 'jspdf';

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
        <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px;">
          <img src="/logo.jpg" alt="LogiTrack Logo" style="height: 50px; width: auto;" onerror="this.style.display='none'">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0; font-weight: bold;">BON DE DISTRIBUTION</h1>
        </div>
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
        <div style="border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; background: white;">
          <!-- Table Header -->
          <div style="background: #2563eb; color: white; display: flex; font-weight: 600; font-size: 12px; text-transform: uppercase;">
            <div style="flex: 1; padding: 10px 8px; border-right: 1px solid rgba(255,255,255,0.2);">Référence</div>
            <div style="flex: 1; padding: 10px 8px; border-right: 1px solid rgba(255,255,255,0.2);">Client</div>
            <div style="flex: 1; padding: 10px 8px; border-right: 1px solid rgba(255,255,255,0.2);">Entreprise</div>
            <div style="flex: 1.5; padding: 10px 8px; border-right: 1px solid rgba(255,255,255,0.2);">Adresse</div>
            <div style="flex: 0.8; padding: 10px 8px; border-right: 1px solid rgba(255,255,255,0.2); text-align: right;">Prix (DH)</div>
            <div style="flex: 0.8; padding: 10px 8px; text-align: right;">Frais (DH)</div>
          </div>

          <!-- Table Body -->
          ${sampleColis.map((colis, index) => `
            <div style="background: ${index % 2 === 0 ? 'white' : '#f8fafc'}; display: flex; border-bottom: 1px solid #e2e8f0; font-size: 12px;">
              <div style="flex: 1; padding: 8px 6px; border-right: 1px solid #e2e8f0;"><strong>${colis.reference}</strong></div>
              <div style="flex: 1; padding: 8px 6px; border-right: 1px solid #e2e8f0;">${colis.client}</div>
              <div style="flex: 1; padding: 8px 6px; border-right: 1px solid #e2e8f0;">${colis.entreprise}</div>
              <div style="flex: 1.5; padding: 8px 6px; border-right: 1px solid #e2e8f0;">${colis.adresse}</div>
              <div style="flex: 0.8; padding: 8px 6px; border-right: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #059669;">${colis.prix.toFixed(2)} DH</div>
              <div style="flex: 0.8; padding: 8px 6px; text-align: right; font-weight: 600; color: #059669;">${colis.frais.toFixed(2)} DH</div>
            </div>
          `).join('')}

          <!-- Total Row -->
          <div style="background: #f1f5f9; display: flex; border-top: 2px solid #2563eb; font-weight: 600; font-size: 14px;">
            <div style="flex: 3; padding: 10px 8px; border-right: 1px solid #e2e8f0;"><strong>TOTAL</strong></div>
            <div style="flex: 1.5; padding: 10px 8px; border-right: 1px solid #e2e8f0;"></div>
            <div style="flex: 0.8; padding: 10px 8px; border-right: 1px solid #e2e8f0; text-align: right;"><strong>${totalPrix.toFixed(2)} DH</strong></div>
            <div style="flex: 0.8; padding: 10px 8px; text-align: right;"><strong>${totalFrais.toFixed(2)} DH</strong></div>
          </div>

          <!-- Total General Row -->
          <div style="background: #f1f5f9; display: flex; border-top: 1px solid #2563eb; font-weight: 600; font-size: 14px;">
            <div style="flex: 4.5; padding: 10px 8px; border-right: 1px solid #e2e8f0;"><strong>TOTAL GÉNÉRAL</strong></div>
            <div style="flex: 1.6; padding: 10px 8px; text-align: right;"><strong>${totalGeneral.toFixed(2)} DH</strong></div>
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

// Download bon as PDF file directly to Downloads folder (using same HTML content as print)
export const downloadBonAsPDF = async (bon: Bon): Promise<void> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 20; // Larger margin for desktop
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
      }
    ];

    const totalPrix = sampleColis.reduce((sum, colis) => sum + colis.prix, 0);
    const totalFrais = sampleColis.reduce((sum, colis) => sum + colis.frais, 0);
    const totalGeneral = totalPrix + totalFrais;

    // Set font
    pdf.setFont('helvetica');

    let currentY = margin;

    // Header with Logo and Title on same line
    const logoSize = 15;
    const titleY = currentY + 8;

    // Logo on the left
    const logoX = margin;

    try {
      // Load logo from public folder
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';

      await new Promise<void>((resolve) => {
        logoImg.onload = () => {
          try {
            // Create canvas to convert image to base64
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = logoImg.width;
            canvas.height = logoImg.height;
            ctx?.drawImage(logoImg, 0, 0);

            const logoBase64 = canvas.toDataURL('image/png');
            // Add logo left aligned
            pdf.addImage(logoBase64, 'PNG', logoX, currentY, logoSize, logoSize);
            resolve();
          } catch (error) {
            console.warn('Could not load logo, using fallback');
            // Fallback to text logo (left aligned)
            pdf.setFillColor(37, 99, 235);
            pdf.circle(logoX + (logoSize / 2), currentY + (logoSize / 2), logoSize / 2, 'F');
            pdf.setFontSize(8);
            pdf.setTextColor(255, 255, 255);
            pdf.text('LT', logoX + (logoSize / 2), currentY + (logoSize / 2) + 2, { align: 'center' });
            resolve();
          }
        };

        logoImg.onerror = () => {
          console.warn('Logo not found, using fallback');
          // Fallback to text logo (left aligned)
          pdf.setFillColor(37, 99, 235);
          pdf.circle(logoX + (logoSize / 2), currentY + (logoSize / 2), logoSize / 2, 'F');
          pdf.setFontSize(8);
          pdf.setTextColor(255, 255, 255);
          pdf.text('LT', logoX + (logoSize / 2), currentY + (logoSize / 2) + 2, { align: 'center' });
          resolve();
        };

        logoImg.src = '/logo.jpg';
      });
    } catch (error) {
      console.warn('Error loading logo:', error);
      // Fallback to text logo (left aligned)
      pdf.setFillColor(37, 99, 235);
      pdf.circle(logoX + (logoSize / 2), currentY + (logoSize / 2), logoSize / 2, 'F');
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      pdf.text('LT', logoX + (logoSize / 2), currentY + (logoSize / 2) + 2, { align: 'center' });
    }

    // Main title (centered, same line as logo)
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(37, 99, 235); // Blue color
    pdf.text('BON DE DISTRIBUTION', pageWidth / 2, titleY, { align: 'center' });

    currentY += 20; // Move past the title line

    // Subtitle (centered)
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(102, 102, 102); // Gray color
    pdf.text('LogiTrack - Système de gestion logistique', pageWidth / 2, currentY, { align: 'center' });
    currentY += 12;

    // Blue separator line
    pdf.setDrawColor(37, 99, 235);
    pdf.setLineWidth(1);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 15;

    // Two-column layout for Bon Info and Livreur Info
    const leftColumnX = margin;
    const rightColumnX = pageWidth / 2 + 5;
    const columnWidth = (contentWidth / 2) - 5;

    // Left Column: Bon Info Section
    const bonInfoStartY = currentY;

    // Bon Info Card Background (matching print style)
    pdf.setFillColor(248, 250, 252); // #f8fafc - Light blue background
    pdf.setDrawColor(248, 250, 252); // Same color for border
    pdf.setLineWidth(0.5);
    pdf.roundedRect(leftColumnX, bonInfoStartY, columnWidth, 45, 3, 3, 'FD'); // Card background with rounded corners

    // Left blue border (4px thick like print version)
    pdf.setDrawColor(37, 99, 235); // #2563eb - Blue color
    pdf.setLineWidth(4);
    pdf.line(leftColumnX, bonInfoStartY + 2, leftColumnX, bonInfoStartY + 43); // 4px thick left border

    // Title
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(37, 99, 235); // #2563eb - Blue title
    pdf.text('Informations générales', leftColumnX + 8, bonInfoStartY + 10);

    // Content with proper styling like print version
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    let infoY = bonInfoStartY + 18;

    // ID Bon
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105); // #475569 - Gray for labels
    pdf.text('ID Bon:', leftColumnX + 8, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 41, 59); // #1e293b - Dark for values
    pdf.text(bon.id, leftColumnX + 30, infoY);

    infoY += 6;
    // Type
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text('Type:', leftColumnX + 8, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 41, 59);
    pdf.text(bon.type.charAt(0).toUpperCase() + bon.type.slice(1), leftColumnX + 30, infoY);

    infoY += 6;
    // Statut
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text('Statut:', leftColumnX + 8, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 41, 59);
    pdf.text(getStatusText(bon.statut), leftColumnX + 30, infoY);

    infoY += 6;
    // Date
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text('Date de création:', leftColumnX + 8, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 41, 59);
    pdf.text(formatDate(bon.date_creation), leftColumnX + 50, infoY);

    if (bon.nb_colis) {
      infoY += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(71, 85, 105);
      pdf.text('Nombre de colis:', leftColumnX + 8, infoY);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(30, 41, 59);
      pdf.text(`${bon.nb_colis} colis`, leftColumnX + 50, infoY);
    }

    // Right Column: Livreur Info Section (if user exists)
    if (bon.user) {
      // Livreur Info Card Background (matching print style)
      pdf.setFillColor(248, 250, 252); // #f8fafc - Light blue background
      pdf.setDrawColor(248, 250, 252); // Same color for border
      pdf.setLineWidth(0.5);
      pdf.roundedRect(rightColumnX, bonInfoStartY, columnWidth, 45, 3, 3, 'FD'); // Card background with rounded corners

      // Left blue border (4px thick like print version)
      pdf.setDrawColor(37, 99, 235); // #2563eb - Blue color
      pdf.setLineWidth(4);
      pdf.line(rightColumnX, bonInfoStartY + 2, rightColumnX, bonInfoStartY + 43); // 4px thick left border

      // Title
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(37, 99, 235); // #2563eb - Blue title
      pdf.text('Livreur assigné', rightColumnX + 8, bonInfoStartY + 10);

      // Content with proper styling like print version
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      let livreurY = bonInfoStartY + 18;

      // Nom
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(71, 85, 105); // #475569 - Gray for labels
      pdf.text('Nom:', rightColumnX + 8, livreurY);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(30, 41, 59); // #1e293b - Dark for values
      pdf.text(`${bon.user.nom} ${bon.user.prenom || ''}`, rightColumnX + 30, livreurY);

      if (bon.user.email) {
        livreurY += 6;
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(71, 85, 105);
        pdf.text('Email:', rightColumnX + 8, livreurY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(30, 41, 59);
        pdf.text(bon.user.email, rightColumnX + 30, livreurY);
      }

      if (bon.user.telephone) {
        livreurY += 6;
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(71, 85, 105);
        pdf.text('Téléphone:', rightColumnX + 8, livreurY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(30, 41, 59);
        pdf.text(bon.user.telephone, rightColumnX + 40, livreurY);
      }

      if (bon.user.zone) {
        livreurY += 6;
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(71, 85, 105);
        pdf.text('Zone:', rightColumnX + 8, livreurY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(30, 41, 59);
        pdf.text(bon.user.zone, rightColumnX + 30, livreurY);
      }
    }

    currentY += 55; // Move past the cards

    // Colis Table Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(37, 99, 235);
    pdf.text(`Liste des Colis (${sampleColis.length} colis)`, margin, currentY);
    currentY += 12;

    // Table Header
    const colWidths = [30, 30, 30, 50, 25, 25]; // Column widths for desktop
    const colPositions = [margin];
    for (let i = 1; i < colWidths.length; i++) {
      colPositions[i] = colPositions[i-1] + colWidths[i-1];
    }

    // Header background
    pdf.setFillColor(37, 99, 235); // Blue background
    pdf.rect(margin, currentY, contentWidth, 10, 'F');

    // Header text
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255); // White text

    pdf.text('RÉFÉRENCE', colPositions[0] + 2, currentY + 6);
    pdf.text('CLIENT', colPositions[1] + 2, currentY + 6);
    pdf.text('ENTREPRISE', colPositions[2] + 2, currentY + 6);
    pdf.text('ADRESSE', colPositions[3] + 2, currentY + 6);
    pdf.text('FRAIS (DH)', colPositions[4] + 2, currentY + 6);
    pdf.text('PRIX (DH)', colPositions[5] + 2, currentY + 6);

    currentY += 10;

    // Table rows
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');

    sampleColis.forEach((colis, index) => {
      // Alternating row colors
      if (index % 2 === 0) {
        pdf.setFillColor(255, 255, 255); // White
      } else {
        pdf.setFillColor(248, 250, 252); // Light gray
      }
      pdf.rect(margin, currentY, contentWidth, 8, 'F');

      // Row borders
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.1);
      for (let i = 0; i < colPositions.length; i++) {
        pdf.line(colPositions[i], currentY, colPositions[i], currentY + 8);
      }
      pdf.line(margin + contentWidth, currentY, margin + contentWidth, currentY + 8);
      pdf.line(margin, currentY + 8, margin + contentWidth, currentY + 8);

      // Row text
      pdf.setTextColor(30, 41, 59); // Dark text

      // Reference (bold)
      pdf.setFont('helvetica', 'bold');
      pdf.text(colis.reference, colPositions[0] + 2, currentY + 5);

      // Other columns (normal)
      pdf.setFont('helvetica', 'normal');
      pdf.text(colis.client, colPositions[1] + 2, currentY + 5);
      pdf.text(colis.entreprise, colPositions[2] + 2, currentY + 5);

      // Truncate address if too long
      const maxAddressLength = 30;
      const address = colis.adresse.length > maxAddressLength
        ? colis.adresse.substring(0, maxAddressLength) + '...'
        : colis.adresse;
      pdf.text(address, colPositions[3] + 2, currentY + 5);

      // Price columns (green color)
      pdf.setTextColor(5, 150, 105); // Green color
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${colis.frais.toFixed(2)}`, colPositions[4] + colWidths[4] - 2, currentY + 5, { align: 'right' });
      pdf.text(`${colis.prix.toFixed(2)}`, colPositions[5] + colWidths[5] - 2, currentY + 5, { align: 'right' });

      currentY += 8;
    });

    // Total row
    pdf.setFillColor(241, 245, 249); // Light blue background
    pdf.rect(margin, currentY, contentWidth, 10, 'F');

    // Total row borders
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.1);
    pdf.rect(margin, currentY, contentWidth, 10);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 41, 59);
    pdf.text('TOTAL', colPositions[0] + 2, currentY + 6);

    pdf.setTextColor(5, 150, 105);
    pdf.text(`${totalFrais.toFixed(2)}`, colPositions[4] + colWidths[4] - 2, currentY + 6, { align: 'right' });
    pdf.text(`${totalPrix.toFixed(2)}`, colPositions[5] + colWidths[5] - 2, currentY + 6, { align: 'right' });

    currentY += 10;

    // Total General row
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, currentY, contentWidth, 10, 'F');

    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.1);
    pdf.rect(margin, currentY, contentWidth, 10);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 41, 59);
    pdf.text('TOTAL GÉNÉRAL', colPositions[0] + 2, currentY + 6);

    pdf.setTextColor(5, 150, 105);
    pdf.text(`${totalGeneral.toFixed(2)} DH`, colPositions[5] + colWidths[5] - 2, currentY + 6, { align: 'right' });

    currentY += 20;

    // Notes section (if exists)
    if (bon.notes) {
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(4);
      pdf.roundedRect(margin, currentY, contentWidth, 25, 3, 3, 'FD');

      // Left blue border
      pdf.line(margin, currentY + 2, margin, currentY + 23);

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(37, 99, 235);
      pdf.text('Notes', margin + 8, currentY + 10);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(30, 41, 59);
      pdf.text(bon.notes, margin + 8, currentY + 18);

      currentY += 30;
    }

    // Footer
    currentY += 15;
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Document généré le ${formatDate(new Date().toISOString())} par LogiTrack`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    pdf.text(`Total des colis: ${sampleColis.length} | Montant total: ${totalGeneral.toFixed(2)} DH`, pageWidth / 2, currentY, { align: 'center' });

    // Generate filename and download
    const filename = `Bon_Distribution_${bon.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);

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
