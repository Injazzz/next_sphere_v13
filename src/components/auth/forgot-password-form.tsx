"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { forgetPassword } from "@/lib/auth-client";

const ForgotPasswordForm = () => {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleResendVerificationEmail(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const email = String(formData.get("email"));

    if (!email) {
      return toast.error("Please enter your email.");
    }

    await forgetPassword({
      email,
      redirectTo: "/reset-password",
      fetchOptions: {
        onRequest: () => {
          setIsPending(true);
        },
        onResponse: () => {
          setIsPending(false);
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
        onSuccess: () => {
          toast.success("Password reset link sent to your email.");

          // Instead of reloading the page, redirect with the resent parameter
          router.push("/forgot-password?sent=true");
        },
      },
    });
  }

  return (
    <form
      onSubmit={handleResendVerificationEmail}
      className='w-full space-y-4 mt-2'
    >
      <div className='flex flex-col gap-4'>
        <Label htmlFor='email'>Email</Label>
        <Input
          type='email'
          name='email'
          placeholder='Enter your email address'
        />
      </div>
      <Button type='submit' disabled={isPending} className='w-full'>
        {isPending ? "Sending reset link..." : "Send reset link"}
      </Button>
    </form>
  );
};

export default ForgotPasswordForm;
