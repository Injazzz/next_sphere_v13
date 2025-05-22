"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string;
  companyName: string;
  companyEmail: string;
  companyAddress?: string;
}

interface GuestAuthContextType {
  client: Client | null;
  isLoading: boolean;
  login: (email: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
  getClient: () => Promise<void>;
}

const GuestAuthContext = createContext<GuestAuthContextType | undefined>(
  undefined
);

export function GuestAuthProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    getClient();
  }, []);

  const getClient = async () => {
    try {
      const response = await fetch("/api/guest/profile");

      if (response.ok) {
        const data = await response.json();
        setClient(data.client);
      } else {
        setClient(null);
      }
    } catch (error) {
      console.error("Failed to fetch client profile:", error);
      setClient(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/guest/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, token }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Login failed");
        return;
      }

      await getClient();
      toast.success("Login successful");
      router.push("/guest/profile");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/guest/logout", {
        method: "POST",
      });
      setClient(null);
      toast.success("Logged out successfully");
      router.push("/guest/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An error occurred during logout");
    }
  };

  return (
    <GuestAuthContext.Provider
      value={{ client, isLoading, login, logout, getClient }}
    >
      {children}
    </GuestAuthContext.Provider>
  );
}

export function useGuestAuth() {
  const context = useContext(GuestAuthContext);
  if (context === undefined) {
    throw new Error("useGuestAuth must be used within a GuestAuthProvider");
  }
  return context;
}
