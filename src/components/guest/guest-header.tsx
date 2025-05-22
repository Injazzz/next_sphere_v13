"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGuestAuth } from "@/context/auth-guest";
import { Button } from "@/components/ui/button";
import { LogOut, Blocks, UserRound, LibraryBig } from "lucide-react";

export default function GuestHeader() {
  const pathname = usePathname();
  const { client, logout } = useGuestAuth();

  if (!client) return null;

  const navigation = [
    {
      name: "Profile",
      href: "/guest/profile",
      icon: UserRound,
      active: pathname === "/guest/profile",
    },
    {
      name: "Documents",
      href: "/guest/documents",
      icon: LibraryBig,
      active: pathname.startsWith("/guest/documents"),
    },
  ];

  return (
    <header className='border-b backdrop-blur-2xl sticky top-0 z-50'>
      <div className='flex w-full max-w-7xl mx-auto h-16 items-center justify-between px-4'>
        <div className='flex items-center gap-8'>
          <Link href='/guest/profile' className='flex items-center gap-2'>
            <Blocks />
            <span className='text-lg font-bold'>Client Portal</span>
          </Link>
          <nav className='flex items-center gap-4'>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1 text-sm font-medium ${
                  item.active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className='h-4 w-4' />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className='flex items-center gap-4'>
          <div className='text-sm'>
            <span className='text-muted-foreground'>Logged in as:</span>{" "}
            <span className='font-medium'>{client.name}</span>
          </div>
          <Button
            variant='outline'
            size='sm'
            className='gap-1'
            onClick={() => logout()}
          >
            <LogOut className='h-4 w-4' />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
