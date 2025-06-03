"use client";
import { lazy, Suspense, useState } from "react";
import { CirclePlus, FileText, Users, User } from "lucide-react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DocumentCreateDialog } from "./documents/document-create-dialog";
import { CreateClientDialog } from "./client/create-client-dialog";
import { CreateTeamDialog } from "./team/create-team-dialog";
import { SidebarMenuButton } from "./ui/sidebar";
import { Loader } from "./ui/loader";

export function QuickCreateDropdown() {
  const [openDialog, setOpenDialog] = useState<
    "document" | "client" | "team" | null
  >(null);

  const handleSuccess = () => {
    setOpenDialog(null);
  };

  const LazyDropdownMenu = lazy(() =>
    import("@/components/ui/dropdown-menu").then((mod) => ({
      default: mod.DropdownMenu,
    }))
  );

  const LazyDropdownMenuTrigger = lazy(() =>
    import("@/components/ui/dropdown-menu").then((mod) => ({
      default: mod.DropdownMenuTrigger,
    }))
  );

  return (
    <Suspense fallback={<Loader />}>
      <LazyDropdownMenu>
        <LazyDropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip='Quick Create'
            className='bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear'
          >
            <CirclePlus />
            <span>Quick Create</span>
          </SidebarMenuButton>
        </LazyDropdownMenuTrigger>
        <DropdownMenuContent align='start' className='w-48'>
          <DropdownMenuItem
            onClick={() => setOpenDialog("document")}
            className='cursor-pointer'
          >
            <FileText className='mr-2 h-4 w-4' />
            Create Document
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpenDialog("client")}
            className='cursor-pointer'
          >
            <User className='mr-2 h-4 w-4' />
            Create Client
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpenDialog("team")}
            className='cursor-pointer'
          >
            <Users className='mr-2 h-4 w-4' />
            Create Team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </LazyDropdownMenu>

      {/* Document Dialog */}
      <DocumentCreateDialog
        open={openDialog === "document"}
        onOpenChange={(open) => !open && setOpenDialog(null)}
        onSuccess={handleSuccess}
        showTrigger={false}
      />

      {/* Client Dialog */}
      <CreateClientDialog
        open={openDialog === "client"}
        onOpenChange={(open) => !open && setOpenDialog(null)}
        onSuccess={handleSuccess}
        showTrigger={false}
      />

      {/* Team Dialog */}
      <CreateTeamDialog
        open={openDialog === "team"}
        onOpenChange={(open) => !open && setOpenDialog(null)}
        onSuccess={handleSuccess}
        showTrigger={false}
      />
    </Suspense>
  );
}
