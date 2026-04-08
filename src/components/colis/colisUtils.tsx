import { HistoriqueColis, Colis } from '@/types';
import { supabase } from '@/lib/supabase';

export const getInitials = (text: string) => {
  return text
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase();
};

export const formatDateTime = (dateString: string) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString));
};

export const getActionParLabel = (item: HistoriqueColis) => {
  const role = item.user?.role?.toLowerCase();
  if (role === 'admin') {
    return 'Logitrack Admin';
  }
  if (role === 'gestionnaire') {
    return 'Logitrack Gestionnaire';
  }
  if (role === 'livreur') {
    return `${item.user?.prenom ?? ''} ${item.user?.nom ?? ''}`.trim() || 'Livreur';
  }
  if (item.user?.prenom || item.user?.nom) {
    return `${item.user?.prenom ?? ''} ${item.user?.nom ?? ''}`.trim();
  }
  if (item.utilisateur) {
    return item.utilisateur;
  }
  return 'Système';
};

export const renderInformations = (informations?: string) => {
  if (!informations) {
    return <span className="text-gray-600 dark:text-gray-300">Mise à jour du statut du colis.</span>;
  }

  // Check if it starts with "Reporté pour le"
  if (informations.startsWith('Reporté pour le')) {
    // Extract "Reporté pour le" label and the rest
    const labelMatch = informations.match(/^Reporté pour le\s+(.+?)(?:\s+—\s+(.+))?$/);

    if (labelMatch) {
      const dateAndRest = labelMatch[1]; // "DD/MM/YYYY" or "DD/MM/YYYY — note"
      const additionalNote = labelMatch[2]; // optional additional note

      return (
        <div className="text-gray-700 dark:text-gray-200">
          <span className="font-bold text-black dark:text-white">Reporté pour le</span>
          <span className="text-gray-600 dark:text-gray-300"> : {dateAndRest}</span>
          {additionalNote && (
            <>
              <span className="text-gray-600 dark:text-gray-300"> — </span>
              <span className="text-gray-600 dark:text-gray-300">{additionalNote}</span>
            </>
          )}
        </div>
      );
    }
  }

  // Default rendering for non-report statuses
  return <span className="text-gray-600 dark:text-gray-300">{informations}</span>;
};

export const getEtatBadgeClass = (etat: string) => {
  switch ((etat || '').toLowerCase()) {
    case 'payé':
    case 'paye':
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300';
    case 'non payé':
    case 'non paye':
    case 'unpaid':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 border-gray-300';
  }
};

export const handleWhatsApp = (colisItem: Colis) => {
  if (colisItem.client?.telephone) {
    let phoneNumber = colisItem.client.telephone.replace(/\D/g, ''); // Remove all non-digits

    // Handle Moroccan phone numbers
    if (phoneNumber.startsWith('0')) {
      // Remove leading 0 and add Moroccan country code
      phoneNumber = '212' + phoneNumber.substring(1);
    } else if (phoneNumber.length === 9 && !phoneNumber.startsWith('212')) {
      // If it's 9 digits without country code, add Moroccan country code
      phoneNumber = '212' + phoneNumber;
    }
    // If it already has country code or is in correct format, use as is

    const message = `Bonjour, concernant votre colis ${colisItem.id}`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  }
};

export const handleSMS = (colisItem: Colis) => {
  if (colisItem.client?.telephone) {
    let phoneNumber = colisItem.client.telephone.replace(/\D/g, ''); // Remove all non-digits

    // Handle Moroccan phone numbers
    if (phoneNumber.startsWith('0')) {
      // Remove leading 0 and add Moroccan country code
      phoneNumber = '212' + phoneNumber.substring(1);
    } else if (phoneNumber.length === 9 && !phoneNumber.startsWith('212')) {
      // If it's 9 digits without country code, add Moroccan country code
      phoneNumber = '212' + phoneNumber;
    }

    const message = `Bonjour, concernant votre colis ${colisItem.id}`;
    window.open(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`, '_blank');
  }
};

export const handleCall = (colisItem: Colis) => {
  if (colisItem.client?.telephone) {
    let phoneNumber = colisItem.client.telephone;

    // For calling, keep the original format but ensure it's clean
    phoneNumber = phoneNumber.replace(/\s+/g, ''); // Remove spaces

    window.open(`tel:${phoneNumber}`, '_blank');
  }
};