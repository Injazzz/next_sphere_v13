import GuestLoginForm from "@/components/guest/guest-login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guest Login",
  description: "Login page for clients to access their documents",
};

export default function GuestLoginPage() {
  return (
    <div className='container flex flex-col items-center justify-center h-screen max-w-md mx-auto'>
      <div className='w-full p-8 space-y-6 border rounded-lg shadow-lg'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold'>Client Login</h1>
          <p className='text-sm text-muted-foreground'>
            Enter your email and token to access your documents
          </p>
        </div>
        <GuestLoginForm />
      </div>
    </div>
  );
}
