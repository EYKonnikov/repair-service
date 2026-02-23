import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Wrench, PlusCircle, ClipboardList, LogOut, HardHat } from "lucide-react";

const roleLabels: Record<string, string> = {
  dispatcher: "Диспетчер",
  master: "Мастер",
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const dispatcherItems = [
    { title: "Новая заявка", url: "/", icon: PlusCircle },
    { title: "Панель диспетчера", url: "/dispatcher", icon: ClipboardList },
  ];

  const masterItems = [
    { title: "Новая заявка", url: "/", icon: PlusCircle },
    { title: "Мои заявки", url: "/master", icon: HardHat },
  ];

  const items = user?.role === "dispatcher" ? dispatcherItems : masterItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-sm">Ремонтная служба</div>
            <div className="text-xs text-muted-foreground">{user?.role ? roleLabels[user.role] : ""}</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={location === item.url}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold">
            {user?.fullName?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.fullName}</div>
            <div className="text-xs text-muted-foreground">@{user?.username}</div>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={logout}
          data-testid="button-logout"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          Выйти
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
