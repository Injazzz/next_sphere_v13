import Image from "next/image";
import { Button } from "./button";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";

interface OAuthButtonProps {
  imageSrc: string;
  provider: "google" | "github";
  signUp?: boolean;
}

export const OAuthButton = ({
  imageSrc,
  provider,
  signUp,
}: OAuthButtonProps) => {
  const [isPending, setIsPending] = useState(false);
  const action = signUp ? "Register" : "Login";

  const providerName = provider === "google" ? "Google" : "Github";

  async function handleClick() {
    await signIn.social({
      provider,
      callbackURL: "/dashboard",
      errorCallbackURL: "/login/error",
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
      },
    });
  }

  return (
    <Button
      variant='outline'
      className='w-full h-full'
      type='button'
      disabled={isPending}
      onClick={handleClick}
    >
      <Image src={imageSrc} alt={provider} width={25} height={25} />
      <span className='ml-2'>
        {action} with {providerName}
      </span>
    </Button>
  );
};
