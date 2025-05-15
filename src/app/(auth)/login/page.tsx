import { GalleryVerticalEnd } from "lucide-react";
import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className='grid min-h-svh lg:grid-cols-2'>
      <div className='flex flex-col z-20 dark:bg-black/35 bg-white/35 backdrop-blur-2xl gap-4 p-6 md:p-10'>
        <div className='flex justify-center gap-2 md:justify-start'>
          <Link href='/' className='flex items-center gap-2 font-medium'>
            <div className='bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md'>
              <GalleryVerticalEnd className='size-4' />
            </div>
            Asphere Apps.
          </Link>
        </div>
        <div className='flex flex-1 items-center justify-center'>
          <div className='w-full max-w-sm'>
            <LoginForm />
          </div>
        </div>
      </div>
      <Image
        src='/image/paper-bg.png'
        alt='Image'
        fill
        className='object-cover dark:brightness-[0.2] dark:grayscale hidden lg:block'
      />
    </div>
  );
}
