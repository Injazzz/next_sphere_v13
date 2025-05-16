"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { sendVerificationEmail } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Loader } from "../ui/loader";

const VerifyEmailForm = () => {
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

    await sendVerificationEmail({
      email,
      callbackURL: "/verify",
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
          toast.success("Verification email sent successfully.");

          // Instead of reloading the page, redirect with the resent parameter
          router.push("/verify?resent=true");
        },
      },
    });
  }

  return (
    <form
      onSubmit={handleResendVerificationEmail}
      className='w-full space-y-4 mt-5'
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
        {isPending ? <Loader /> : "Resend verification email"}
      </Button>
    </form>
  );
};

export default VerifyEmailForm;
