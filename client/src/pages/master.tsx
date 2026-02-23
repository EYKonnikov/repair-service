import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import type { Request as RepairRequest, RequestStatus } from "@shared/schema";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Play,
  CheckCircle,
  Phone,
  MapPin,
  User,
  Clock,
  Wrench,
  Inbox,
} from "lucide-react";

export default function MasterPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: requests = [], isLoading } = useQuery<RepairRequest[]>({
    queryKey: ["/api/requests/my"],
  });

  const takeMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await apiRequest("PATCH", `/api/requests/${requestId}/take`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests/my"] });
      toast({ title: "Заявка принята", description: "Вы начали работу над заявкой." });
    },
    onError: (error: Error) => {
      if (error.message.includes("409")) {
        toast({
          title: "Конфликт",
          description: "Эта заявка уже взята в работу или её статус изменился.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/requests/my"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await apiRequest("PATCH", `/api/requests/${requestId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests/my"] });
      toast({ title: "Заявка завершена", description: "Ремонт отмечен как выполненный." });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const assigned = requests.filter((r) => r.status === "assigned");
  const inProgress = requests.filter((r) => r.status === "in_progress");
  const done = requests.filter((r) => r.status === "done");

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary" />
            Мои заявки
          </h1>
          <p className="text-muted-foreground mt-1">
            Управление назначенными заявками на ремонт
          </p>
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
            <h3 className="text-lg font-medium">Заявок пока нет</h3>
            <p className="text-muted-foreground text-sm">
              Вам ещё не назначены заявки на ремонт
            </p>
          </div>
        ) : (
          <>
            {assigned.length > 0 && (
              <Section title="Назначены вам" count={assigned.length}>
                {assigned.map((request) => (
                  <MasterRequestCard
                    key={request.id}
                    request={request}
                    onTake={() => takeMutation.mutate(request.id)}
                    isTaking={takeMutation.isPending}
                  />
                ))}
              </Section>
            )}

            {inProgress.length > 0 && (
              <Section title="В работе" count={inProgress.length}>
                {inProgress.map((request) => (
                  <MasterRequestCard
                    key={request.id}
                    request={request}
                    onComplete={() => completeMutation.mutate(request.id)}
                    isCompleting={completeMutation.isPending}
                  />
                ))}
              </Section>
            )}

            {done.length > 0 && (
              <Section title="Выполненные" count={done.length}>
                {done.map((request) => (
                  <MasterRequestCard key={request.id} request={request} />
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-medium">
          {count}
        </span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function MasterRequestCard({
  request,
  onTake,
  onComplete,
  isTaking,
  isCompleting,
}: {
  request: RepairRequest;
  onTake?: () => void;
  onComplete?: () => void;
  isTaking?: boolean;
  isCompleting?: boolean;
}) {
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

        {request.status === "assigned" && onTake && (
          <div className="pt-3 border-t">
            <Button
              size="sm"
              onClick={onTake}
              disabled={isTaking}
              data-testid={`button-take-${request.id}`}
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              {isTaking ? "Принимаю..." : "Взять в работу"}
            </Button>
          </div>
        )}

        {request.status === "in_progress" && onComplete && (
          <div className="pt-3 border-t">
            <Button
              size="sm"
              onClick={onComplete}
              disabled={isCompleting}
              data-testid={`button-complete-${request.id}`}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              {isCompleting ? "Завершаю..." : "Завершить"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
