import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(username, password);
    } catch {
      setError("Неверное имя пользователя или пароль");
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (user: string, pass: string) => {
    setError("");
    setIsLoading(true);
    try {
      await login(user, pass);
    } catch {
      setError("Ошибка входа");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-md bg-primary/10 mb-4">
            <Wrench className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Ремонтная служба</h1>
          <p className="text-muted-foreground">Система управления заявками</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Вход в систему</CardTitle>
            <CardDescription>Введите логин и пароль для доступа</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md" data-testid="text-error">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Логин</Label>
                <Input
                  id="username"
                  data-testid="input-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите логин"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  data-testid="input-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {isLoading ? "Вход..." : "Войти"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Быстрый вход (тестовые аккаунты)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => quickLogin("dispatcher", "dispatcher123")}
              disabled={isLoading}
              data-testid="button-quick-dispatcher"
            >
              <div className="flex items-center gap-3">
                <RoleBadge role="dispatcher" />
                <div className="text-left">
                  <div className="font-medium">Анна Петрова</div>
                  <div className="text-xs text-muted-foreground">Диспетчер</div>
                </div>
              </div>
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => quickLogin("master1", "master123")}
              disabled={isLoading}
              data-testid="button-quick-master1"
            >
              <div className="flex items-center gap-3">
                <RoleBadge role="master" />
                <div className="text-left">
                  <div className="font-medium">Иван Сидоров</div>
                  <div className="text-xs text-muted-foreground">Мастер</div>
                </div>
              </div>
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => quickLogin("master2", "master123")}
              disabled={isLoading}
              data-testid="button-quick-master2"
            >
              <div className="flex items-center gap-3">
                <RoleBadge role="master" />
                <div className="text-left">
                  <div className="font-medium">Дмитрий Козлов</div>
                  <div className="text-xs text-muted-foreground">Мастер</div>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <div
      className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${
        role === "dispatcher"
          ? "bg-primary/15 text-primary"
          : "bg-chart-2/15 text-chart-2"
      }`}
    >
      {role === "dispatcher" ? "Д" : "М"}
    </div>
  );
}
