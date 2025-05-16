"use client";

import { Button } from "./button";
import { signOut } from "@/lib/auth-client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Loader } from "./loader";

export const SignOutButton = () => {
  const [isLoggingOut, setisLoggingOut] = useState(false);
  const [isLogoutSuccess, setIsLogoutSuccess] = useState(false);

  useEffect(() => {
    if (isLogoutSuccess) {
      const redirectTimer = setTimeout(() => {
        window.location.replace("/login");
      }, 1000);

      return () => clearTimeout(redirectTimer);
    }
  }, [isLogoutSuccess]);

  async function handleLogOut() {
    await signOut({
      fetchOptions: {
        onRequest: () => {
          setisLoggingOut(true);
        },
        onResponse: () => {
          setisLoggingOut(false);
        },
        onError: (context) => {
          toast.error(context.error.message);
        },
        onSuccess: () => {
          toast.success("You've logged out. See you soon!");
          setIsLogoutSuccess(true);
        },
      },
    });
  }
  return (
    <Button
      onClick={handleLogOut}
      variant={"destructive"}
      size={"sm"}
      className='w-24 px-4'
      disabled={isLoggingOut}
    >
      {isLoggingOut ? <Loader /> : "Log out"}
    </Button>
  );
};
