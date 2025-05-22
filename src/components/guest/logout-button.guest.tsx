"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GuestLogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/guest/logout", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Terjadi kesalahan saat logout");
      }

      toast.success("Logout berhasil");
      router.push("/guest/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Terjadi kesalahan saat logout"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant='destructive'
      onClick={handleLogout}
      disabled={isLoading}
      className='flex items-center gap-2'
    >
      <LogOut className='h-4 w-4' />
      {isLoading ? "Processing..." : "Logout"}
    </Button>
  );
}
