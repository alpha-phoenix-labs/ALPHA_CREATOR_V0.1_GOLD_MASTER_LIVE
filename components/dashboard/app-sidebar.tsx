"use client";

import {
  BarChart3,
  Beaker,
  Blocks,
  Compass,
  FileStack,
  Gauge,
  Plus,
  Settings,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";

import { AlphaPrimaryButton } from "@/components/alpha/alpha-ui";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const primaryNavigation = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "create", label: "Create", icon: WandSparkles },
  { id: "content", label: "Content", icon: FileStack },
  { id: "experiments", label: "Experiments", icon: Beaker },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "intelligence", label: "Intelligence", icon: Sparkles },
];

export function AppSidebar({
  activeRoute,
  onNewContent,
}: {
  activeRoute: string;
  onNewContent: () => void;
}) {
  return (
    <Sidebar collapsible="icon" className="alpha-sidebar">
      <SidebarHeader className="alpha-sidebar-header">
        <Link href="/dashboard" className="alpha-brand" aria-label="ALPHA CREATOR dashboard">
          <span className="alpha-brand-mark" aria-hidden="true">
            <Blocks size={19} />
          </span>
          <span className="alpha-brand-copy">
            <strong>ALPHA</strong>
            <small>CREATOR</small>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="alpha-sidebar-label">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {primaryNavigation.map((item) => {
                const Icon = item.icon;
                const active = item.id === activeRoute;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className={cn("alpha-nav-button", active && "alpha-nav-button-active")}
                    >
                      <Link href={`/${item.id}`} aria-current={active ? "page" : undefined}>
                        <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="alpha-sidebar-footer">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={activeRoute === "settings"}
              tooltip="Settings"
              className="alpha-nav-button"
            >
              <Link href="/settings">
                <Settings size={19} strokeWidth={1.7} aria-hidden="true" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <AlphaPrimaryButton className="alpha-sidebar-create" onClick={onNewContent}>
          <Plus size={17} aria-hidden="true" />
          <span>New Content</span>
        </AlphaPrimaryButton>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
