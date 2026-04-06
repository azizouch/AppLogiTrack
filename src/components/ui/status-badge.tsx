import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/lib/utils";

interface StatusBadgeProps {
  statut: string;
  statuts: Array<{
    nom: string;
    couleur: string;
  }>;
}

export function StatusBadge({ statut, statuts }: StatusBadgeProps) {
  const statutData = statuts.find(s => s.nom === statut);

  if (statutData && statutData.couleur) {
    const badgeClass = getStatusBadgeClass(statutData.couleur);
    return (
      <Badge className={`${badgeClass} text-xs py-1 px-3 hover:bg-transparent`}>
        {statutData.nom}
      </Badge>
    );
  }

  // Fallback for unknown status
  return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 text-xs py-1 px-3 hover:bg-transparent">{statut}</Badge>;
}