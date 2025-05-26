import { GuestLoginForm } from "@/components/guest/guest-login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guest Login",
  description: "Login page for clients to access their documents",
};

export default function GuestLoginPage() {
  return (
    <div className='flex flex-col items-center justify-center h-screen'>
      <div className='w-full p-8 space-y-6 rounded-lg shadow-lg'>
        <div className='w-full max-w-sm mx-auto'>
          {" "}
          <GuestLoginForm />
        </div>
      </div>
    </div>
  );
}
