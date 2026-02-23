import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createRequestSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send, CheckCircle, User, Phone, MapPin, FileText } from "lucide-react";
import { useState } from "react";

type FormValues = z.infer<typeof createRequestSchema>;

export default function CreateRequestPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      clientName: "",
      phone: "",
      address: "",
      problemText: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setSubmitted(true);
      form.reset();
      toast({ title: "Заявка создана", description: "Ваша заявка на ремонт успешно отправлена." });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-chart-2/15">
            <CheckCircle className="w-8 h-8 text-chart-2" />
          </div>
          <h2 className="text-2xl font-bold">Заявка отправлена</h2>
          <p className="text-muted-foreground">
            Ваша заявка на ремонт успешно отправлена. Диспетчер рассмотрит её и назначит мастера в ближайшее время.
          </p>
          <Button onClick={() => setSubmitted(false)} data-testid="button-new-request">
            Создать ещё одну заявку
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Новая заявка</h1>
          <p className="text-muted-foreground mt-1">
            Заполните форму для подачи заявки на ремонт
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Данные заявки</CardTitle>
            <CardDescription>Все поля обязательны для заполнения</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <User className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        Имя клиента
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ФИО клиента"
                          data-testid="input-client-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Phone className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        Телефон
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+7 (XXX) XXX-XX-XX"
                          data-testid="input-phone"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <MapPin className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        Адрес
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Улица, дом, квартира"
                          data-testid="input-address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="problemText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <FileText className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        Описание проблемы
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Опишите проблему подробно..."
                          className="min-h-[120px] resize-none"
                          data-testid="input-problem"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                  data-testid="button-submit-request"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {mutation.isPending ? "Отправка..." : "Отправить заявку"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
