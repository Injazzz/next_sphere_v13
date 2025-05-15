import { SignOutButton } from "@/components/ui/sign-out-button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");
  return (
    <div className='w-full flex flex-col gap-10'>
      <h1>Profile</h1>

      <SignOutButton />

      <pre className='text-sm overflow-clip'>
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}
