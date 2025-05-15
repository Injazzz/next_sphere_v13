import ForgotPasswordForm from "@/components/auth/forgot-password-form";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import ResetPasswordStatus from "@/components/auth/reset-password-status";
import ReturnButton from "@/components/ui/return-button";

interface PageProps {
  searchParams: { token: string; error?: string; reset?: string };
}

const Page = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const token = params.token;
  const error = params.error;
  const resetSuccess = params.reset == "true";

  return (
    <div className='w-full h-svh flex items-center justify-center p-5'>
      <div className='max-w-lg w-full h-fit rounded-xl border flex flex-col p-8'>
        <div className='flex gap-4 items-start'>
          <ReturnButton href='/login' label='Login' />
          <h1 className='text-2xl sm:text-4xl font-pacifico'>Reset Password</h1>
        </div>

        {error === "INVALID_TOKEN" || error === "TOKEN_EXPIRED" ? (
          <>
            <p className='text-destructive text-sm mt-8 text-center'>
              Your token is invalid or expired. Please request a new one.
            </p>
            <div>
              <ForgotPasswordForm />
            </div>
          </>
        ) : null}

        <div className='mt-5'>
          {resetSuccess && !error && <ResetPasswordStatus />}

          {!error && resetSuccess === false && (
            <ResetPasswordForm token={token} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
