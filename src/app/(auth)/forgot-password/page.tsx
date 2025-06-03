import ReturnButton from "@/components/ui/return-button";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";

interface PageProps {
  searchParams: Promise<{ sent?: string }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const sent = params.sent === "true";

  return (
    <div className='w-full h-svh flex items-center justify-center p-5'>
      <div className='max-w-lg w-full h-fit rounded-xl border flex flex-col p-8'>
        <div className='flex gap-4 items-start'>
          <ReturnButton href='/login' label='Login' />
          <h1 className='text-2xl sm:text-4xl font-pacifico'>
            Forgot Password
          </h1>
        </div>

        {sent ? (
          // Email resent success state
          <div className='mt-8'>
            <p className='text-green-500 text-sm mb-4'>
              Reset link has been successfully sent. Please check your inbox.
            </p>
          </div>
        ) : (
          <div className='mt-6'>
            <p className='text-sm mb-4'>
              Enter your email to receive password reset link.
            </p>

            <div>
              <ForgotPasswordForm />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
