"use client";

import * as React from "react";
import { NavDocuments } from "@/components/nav-aging-tracks";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Blend,
  ChartColumnBig,
  CircleCheck,
  CircleHelp,
  Clock,
  ClockAlert,
  ClockFading,
  Cog,
  ContactRound,
  Folder,
  LayoutDashboard,
  LibraryBig,
  Search,
  UsersRound,
} from "lucide-react";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Team",
      url: "/dashboard/teams",
      icon: UsersRound,
    },
    {
      title: "Clients",
      url: "/dashboard/clients",
      icon: ContactRound,
    },

    {
      title: "Documents",
      url: "/dashboard/documents",
      icon: Folder,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: ChartColumnBig,
    },
    {
      title: "Reports",
      url: "/dashboard/reports",
      icon: LibraryBig,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Cog,
    },
    {
      title: "Get Help",
      url: "/dashboard/get-help",
      icon: CircleHelp,
    },
    {
      title: "Search",
      url: "/dashboard/search",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Draft",
      url: "/dashboard/aging",
      icon: ClockFading,
    },
    {
      name: "Active",
      url: "/dashboard/aging",
      icon: Clock,
    },
    {
      name: "Overdue",
      url: "/dashboard/aging",
      icon: ClockAlert,
    },
    {
      name: "Completed",
      url: "/dashboard/aging",
      icon: CircleCheck,
    },
  ],
};

export function AppSidebar({
  session,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}) {
  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className='data-[slot=sidebar-menu-button]:!p-1.5'
            >
              <a href='#'>
                <Blend className='!size-5' />
                <span className='text-base font-semibold'>Asphere Apps.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        <NavUser initialSession={session} />
      </SidebarFooter>
    </Sidebar>
  );
}
