"use client";

import { useSession } from "@/lib/auth-client";
import { Button } from "./button";
import Link from "next/link";

export const GetStartedButton = () => {
  const { data: session, isPending } = useSession();

  const href = session ? "/dashboard" : "/login";

  return (
    <div className='flex flex-col items-center gap-4'>
      <Button size='lg' asChild disabled={isPending}>
        <Link href={href}>{isPending ? "Loading..." : "Get Started"}</Link>
      </Button>
      {session && <p>Wellcome back, {session.user.name}! 👋</p>}
    </div>
  );
};
