import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Request as RepairRequest, RequestStatus } from "@shared/schema";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserPlus,
  XCircle,
  Phone,
  MapPin,
  User,
  Clock,
  Filter,
  ClipboardList,
  Inbox,
} from "lucide-react";
import { useState } from "react";

export default function DispatcherPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const queryUrl = statusFilter !== "all" ? `/api/requests?status=${statusFilter}` : "/api/requests";
  const { data: requests = [], isLoading } = useQuery<RepairRequest[]>({
    queryKey: ["/api/requests", statusFilter],
    queryFn: async () => {
      const res = await fetch(queryUrl, { credentials: "include" });
      if (!res.ok) throw new Error("Не удалось загрузить заявки");
      return res.json();
    },
  });

  const { data: masters = [] } = useQuery<{ id: number; fullName: string; username: string }[]>({
    queryKey: ["/api/masters"],
  });

  const assignMutation = useMutation({
    mutationFn: async ({ requestId, masterId }: { requestId: number; masterId: number }) => {
      await apiRequest("PATCH", `/api/requests/${requestId}/assign`, { masterId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({ title: "Мастер назначен", description: "Заявка назначена мастеру." });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await apiRequest("PATCH", `/api/requests/${requestId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({ title: "Заявка отменена", description: "Заявка была отменена." });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const statuses: { value: string; label: string }[] = [
    { value: "all", label: "Все статусы" },
    { value: "new", label: "Новые" },
    { value: "assigned", label: "Назначенные" },
    { value: "in_progress", label: "В работе" },
    { value: "done", label: "Выполненные" },
    { value: "canceled", label: "Отменённые" },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              Панель диспетчера
            </h1>
            <p className="text-muted-foreground mt-1">
              Управление и распределение заявок на ремонт
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter} data-testid="select-status-filter">
              <SelectTrigger className="w-[180px]" data-testid="select-trigger-status">
                <SelectValue placeholder="Фильтр по статусу" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.value} value={s.value} data-testid={`select-item-${s.value}`}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Inbox className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">Заявки не найдены</h3>
            <p className="text-muted-foreground text-sm">
              {statusFilter !== "all"
                ? "Нет заявок, соответствующих выбранному фильтру"
                : "Заявок на ремонт пока нет"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                masters={masters}
                onAssign={(masterId) =>
                  assignMutation.mutate({ requestId: request.id, masterId })
                }
                onCancel={() => cancelMutation.mutate(request.id)}
                isAssigning={assignMutation.isPending}
                isCanceling={cancelMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  masters,
  onAssign,
  onCancel,
  isAssigning,
  isCanceling,
}: {
  request: RepairRequest;
  masters: { id: number; fullName: string }[];
  onAssign: (masterId: number) => void;
  onCancel: () => void;
  isAssigning: boolean;
  isCanceling: boolean;
}) {
  const [selectedMaster, setSelectedMaster] = useState<string>("");
  const assignedMaster = masters.find((m) => m.id === request.assignedTo);

  return (
    <Card data-testid={`card-request-${request.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono text-muted-foreground">#{request.id}</span>
            <StatusBadge status={request.status as RequestStatus} />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Clock className="w-3 h-3" />
            {new Date(request.createdAt).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium" data-testid={`text-client-${request.id}`}>{request.clientName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span data-testid={`text-phone-${request.id}`}>{request.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span data-testid={`text-address-${request.id}`}>{request.address}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 leading-relaxed" data-testid={`text-problem-${request.id}`}>
          {request.problemText}
        </p>

        {assignedMaster && (
          <div className="text-sm mb-3 flex items-center gap-2 text-muted-foreground">
            <UserPlus className="w-3.5 h-3.5" />
            Назначен: <span className="font-medium text-foreground">{assignedMaster.fullName}</span>
          </div>
        )}

        {request.status === "new" && (
          <div className="flex items-center gap-2 pt-3 border-t flex-wrap">
            <Select value={selectedMaster} onValueChange={setSelectedMaster}>
              <SelectTrigger className="w-[200px]" data-testid={`select-master-${request.id}`}>
                <SelectValue placeholder="Выберите мастера..." />
              </SelectTrigger>
              <SelectContent>
                {masters.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)} data-testid={`select-master-option-${m.id}`}>
                    {m.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => onAssign(Number(selectedMaster))}
              disabled={!selectedMaster || isAssigning}
              data-testid={`button-assign-${request.id}`}
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Назначить
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onCancel}
              disabled={isCanceling}
              data-testid={`button-cancel-${request.id}`}
            >
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              Отменить
            </Button>
          </div>
        )}

        {request.status === "assigned" && (
          <div className="flex items-center gap-2 pt-3 border-t">
            <Button
              size="sm"
              variant="destructive"
              onClick={onCancel}
              disabled={isCanceling}
              data-testid={`button-cancel-${request.id}`}
            >
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              Отменить
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
