"use client";

import * as React from "react";
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
  CircleHelp,
  ContactRound,
  Folder,
  FolderKanban,
  LayoutDashboard,
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
      title: "Reports & Analytics",
      url: "/dashboard/analytics",
      icon: FolderKanban,
    },
  ],
  navSecondary: [
    {
      title: "Get Help",
      url: "/dashboard/get-help",
      icon: CircleHelp,
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
        <NavSecondary items={data.navSecondary} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter className='mb-4'>
        <NavUser initialSession={session} />
      </SidebarFooter>
    </Sidebar>
  );
}
