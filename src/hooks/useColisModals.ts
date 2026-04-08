import { useState } from 'react';
import { Colis } from '@/types';

export function useColisModals() {
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);
  const [showReclamationModal, setShowReclamationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSuiviModal, setShowSuiviModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleSuivi = (colis: Colis) => {
    setSelectedColis(colis);
    setShowSuiviModal(true);
  };

  const handleReclamation = (colis: Colis) => {
    setSelectedColis(colis);
    setShowReclamationModal(true);
  };

  const handleViewDetails = (colis: Colis) => {
    setSelectedColis(colis);
    setShowDetailsModal(true);
  };

  const handleStatusChange = (colis: Colis) => {
    setSelectedColis(colis);
    setShowStatusModal(true);
  };

  return {
    selectedColis,
    showReclamationModal,
    showDetailsModal,
    showSuiviModal,
    showStatusModal,
    setShowReclamationModal,
    setShowDetailsModal,
    setShowSuiviModal,
    setShowStatusModal,
    handleSuivi,
    handleReclamation,
    handleViewDetails,
    handleStatusChange,
  };
}