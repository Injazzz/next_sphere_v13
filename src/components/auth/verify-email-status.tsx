"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

const VerifyEmailStatus = () => {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  // Use separate useEffect for setting up timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Use separate useEffect for handling redirect
  useEffect(() => {
    if (countdown <= 0) {
      // Use setTimeout to avoid triggering during render
      const redirectTimeout = setTimeout(() => {
        router.push("/login");
      }, 0);

      return () => clearTimeout(redirectTimeout);
    }
  }, [countdown, router]);

  return (
    <div className='flex flex-col items-center justify-center mt-8 text-center'>
      <CheckCircle className='w-16 h-16 text-green-500 mb-4' />
      <h2 className='text-xl font-medium mb-2'>Email Successfully Verified!</h2>
      <p className='text-muted-foreground mb-6'>
        Your email has been verified successfully.
      </p>
      <p className='text-sm text-muted-foreground'>
        Redirecting to login page in{" "}
        <span className='font-bold'>{countdown}</span> seconds...
      </p>
    </div>
  );
};

export default VerifyEmailStatus;
