import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/lib/utils";
import { Statut } from "@/types";

interface StatusBadgeProps {
  statut?: string;
  status?: string;
  statuts?: Statut[];
}

export function StatusBadge({ statut, status, statuts }: StatusBadgeProps) {
  const currentStatus = statut ?? status ?? 'Inconnu';
  const statutData = statuts?.find(s => s.nom === currentStatus);

  if (statutData && statutData.couleur) {
    const badgeClass = getStatusBadgeClass(statutData.couleur);
    return (
      <Badge className={`${badgeClass} text-xs py-1 px-3 hover:bg-transparent`}>
        {statutData.nom}
      </Badge>
    );
  }

  // Fallback for unknown status
  return (
    <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 text-xs py-1 px-3 hover:bg-transparent">
      {currentStatus}
    </Badge>
  );
}