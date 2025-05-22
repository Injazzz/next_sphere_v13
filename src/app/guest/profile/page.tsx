import GuestHeader from "@/components/guest/guest-header";
import GuestProfileContent from "@/components/guest/guest-profile-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Profile",
  description: "View and manage your profile",
};

export default function GuestProfilePage() {
  return (
    <div className='flex flex-col min-h-screen'>
      <GuestHeader />
      <main className='flex-1 w-full max-w-7xl mx-auto p-4 py-8'>
        <GuestProfileContent />
      </main>
    </div>
  );
}
