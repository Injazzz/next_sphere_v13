import { GuestAuthProvider } from "@/context/auth-guest";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestAuthProvider>
      <div>{children}</div>
    </GuestAuthProvider>
  );
}
