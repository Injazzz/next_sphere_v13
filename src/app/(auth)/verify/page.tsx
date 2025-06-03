// Server Component
import VerifyEmailForm from "@/components/auth/verify-email-form";
import ReturnButton from "@/components/ui/return-button";
import VerifyEmailStatus from "@/components/auth/verify-email-status";

interface PageProps {
  searchParams: Promise<{ error?: string; resent?: string }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const error = params.error;
  const resent = params.resent === "true";

  return (
    <div className='w-full h-svh flex items-center justify-center p-5'>
      <div className='max-w-lg w-full h-fit rounded-xl border flex flex-col p-8'>
        <div className='flex gap-4 items-start'>
          <ReturnButton href='/login' label='Login' />
          <h1 className='text-2xl sm:text-5xl font-pacifico'>Verify email</h1>
        </div>

        {resent ? (
          // Email resent success state
          <div className='mt-6'>
            <p className='text-green-500 text-sm mb-4'>
              Verification email has been successfully resent. Please check your
              inbox.
            </p>
            <VerifyEmailForm />
          </div>
        ) : error ? (
          // Error state - render on server
          <>
            {" "}
            {error === "invalid_token" || error === "token_expired" ? (
              <>
                <p className='text-destructive text-sm mt-8 text-center'>
                  Your token is invalid or expired. Please request a new one.
                </p>
                <div>
                  <VerifyEmailForm />
                </div>
              </>
            ) : error === "email_not_verified" ? (
              <>
                <p className='text-destructive text-sm mt-12 text-center'>
                  Please check your email to verify.
                </p>
              </>
            ) : (
              "Oops! Something went wrong. Please try again."
            )}
          </>
        ) : (
          // Success state - use client component for countdown and redirect
          <VerifyEmailStatus />
        )}
      </div>
    </div>
  );
};

export default Page;
