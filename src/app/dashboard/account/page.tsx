import { UpdateUserForm } from "@/components/account/update-user-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user;

  if (!session) redirect("/login");
  return (
    <div className='w-full flex flex-col gap-10'>
      {user && <UpdateUserForm user={{ ...user, image: user.image ?? null }} />}
    </div>
  );
}
