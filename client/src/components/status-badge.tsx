import { Badge } from "@/components/ui/badge";
import type { RequestStatus } from "@shared/schema";

const statusConfig: Record<RequestStatus, { label: string }> = {
  new: { label: "Новая" },
  assigned: { label: "Назначена" },
  in_progress: { label: "В работе" },
  done: { label: "Выполнена" },
  canceled: { label: "Отменена" },
};

const statusColors: Record<RequestStatus, string> = {
  new: "bg-primary/15 text-primary border-primary/20",
  assigned: "bg-chart-4/15 text-chart-4 border-chart-4/20",
  in_progress: "bg-chart-3/15 text-chart-3 border-chart-3/20",
  done: "bg-chart-2/15 text-chart-2 border-chart-2/20",
  canceled: "bg-destructive/15 text-destructive border-destructive/20",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <Badge variant="outline" className={statusColors[status]} data-testid={`badge-status-${status}`}>
      {statusConfig[status].label}
    </Badge>
  );
}
