/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth-client";
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";
import { CircleUserRound, EllipsisVertical, LogOut } from "lucide-react";

interface NavUserProps {
  initialSession?: any;
}

export function NavUser({ initialSession }: NavUserProps) {
  const { isMobile } = useSidebar();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [session, setSession] = useState(initialSession);
  const [isLoading, setIsLoading] = useState(!initialSession);
  const router = useRouter();

  // Jika tidak ada initial session, fetch dari client
  useEffect(() => {
    if (!initialSession) {
      const fetchSession = async () => {
        try {
          setIsLoading(true);
          const { data: session } = await getSession();
          setSession(session);
        } catch (error) {
          console.error("Failed to fetch session", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSession();
    }
  }, [initialSession]);

  // Redirect jika tidak ada session
  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/login");
    }
  }, [session, isLoading, router]);

  if (isLoading || !session) {
    return (
      <div className='flex items-center space-x-4'>
        <Skeleton className='h-12 w-12 rounded-full' />
        <div className='space-y-2'>
          <Skeleton className='h-4 w-[150px]' />
          <Skeleton className='h-4 w-[180px]' />
        </div>
      </div>
    );
  }

  // Ekstrak informasi user dari session
  const user = {
    name: session.user?.name || "User",
    email: session.user?.email || "user@example.com",
    avatar: session.user?.image || null,
  };

  return (
    <>
      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to log out?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the login page after logging out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='flex justify-end items-center mt-12'>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <SignOutButton />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <Avatar className='h-8 w-8 rounded-full grayscale'>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className='rounded-full'>
                    {user.name?.substring(0, 2).toUpperCase() || "AA"}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>{user.name}</span>
                  <span className='text-muted-foreground truncate text-xs'>
                    {user.email}
                  </span>
                </div>
                <EllipsisVertical className='ml-auto size-4' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              side={isMobile ? "bottom" : "right"}
              align='end'
              sideOffset={4}
            >
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                  <Avatar className='h-8 w-8 rounded-lg'>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className='rounded-lg'>
                      {user.name?.substring(0, 2).toUpperCase() || "AA"}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-medium'>{user.name}</span>
                    <span className='text-muted-foreground truncate text-xs'>
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href='/dashboard/account'>
                    <CircleUserRound className='mr-2 size-4' />
                    Account
                  </Link>
                </DropdownMenuItem>
                {/* <DropdownMenuItem>
                  <CreditCard className='mr-2 size-4' />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className='mr-2 size-4' />
                  Notifications
                </DropdownMenuItem> */}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLogoutDialogOpen(true)}>
                <LogOut className='mr-2 size-4' />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
