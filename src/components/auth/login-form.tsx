"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeClosed } from "lucide-react";
import { signInEmailServerAction } from "@/lib/server/actions/sign-in-email.action";
import { OAuthButton } from "../ui/oauth-button";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (loginSuccess) {
      const redirectTimer = setTimeout(() => {
        window.location.replace("/profile");
      }, 1000);
      return () => clearTimeout(redirectTimer);
    }
  }, [loginSuccess]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    const formData = new FormData(event.target as HTMLFormElement);
    const { error, success } = await signInEmailServerAction(formData);

    if (error) {
      // Try to determine which field the error belongs to
      const errorLower = error.toLowerCase();
      const newFieldErrors = { ...fieldErrors };

      if (errorLower.includes("email")) {
        newFieldErrors.email = error;
      } else if (errorLower.includes("password")) {
        newFieldErrors.password = error;
      } else if (
        errorLower.includes("invalid") ||
        errorLower.includes("credentials")
      ) {
        // For generic "invalid credentials" errors, we'll show it on both fields
        newFieldErrors.email = "Invalid email or password";
        newFieldErrors.password = "Invalid email or password";
      }

      setFieldErrors(newFieldErrors);

      // If no specific field error was set, show as toast
      if (Object.keys(newFieldErrors).length === 0) {
        toast.error(error);
      }

      setIsSubmitting(false);
    } else if (success) {
      toast.success("Successfully logged in! Welcome back.");
      setLoginSuccess(true);
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={handleLogin}
    >
      <div className='flex flex-col items-center gap-2 text-center'>
        <h1 className='text-4xl font-bold font-pacifico'>
          Login to your account
        </h1>
        <p className='dark:text-muted-foreground text-zinc-700 text-sm text-balance mt-4'>
          Fill this blank input below to login to your account
        </p>
      </div>
      <div className='grid gap-6'>
        {/* Email field */}
        <div className='grid gap-2'>
          <Label htmlFor='email' className='flex items-center justify-between'>
            Email
            {fieldErrors.email && (
              <span className='text-destructive text-xs flex items-center'>
                <AlertCircle className='h-3 w-3 mr-1' />
                {fieldErrors.email}
              </span>
            )}
          </Label>
          <Input
            id='email'
            name='email'
            type='email'
            placeholder='youremail@gmail.com'
            className={fieldErrors.email ? "border-destructive" : ""}
            onChange={() => {
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            required
          />
        </div>

        {/* Password field */}
        <div className='grid gap-2'>
          <div className='flex justify-between items-baseline'>
            <Label
              htmlFor='password'
              className='flex items-center justify-between'
            >
              Password
              {fieldErrors.password && (
                <span className='text-destructive text-xs flex items-center'>
                  <AlertCircle className='h-3 w-3 mr-1' />
                  {fieldErrors.password}
                </span>
              )}
            </Label>

            <Link
              href='/forgot-password'
              className='text-xs text-primary hover:underline'
            >
              Forgot password?
            </Link>
          </div>

          <div className='relative'>
            <Input
              id='password'
              name='password'
              type={showPassword ? "text" : "password"}
              placeholder='••••••••'
              className={
                fieldErrors.password ? "border-destructive pr-10" : "pr-10"
              }
              onChange={() => {
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              required
            />
            <button
              type='button'
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500'
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <Eye /> : <EyeClosed />}
            </button>
          </div>
        </div>

        <Button type='submit' className='w-full' disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>

        <div className='after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t'>
          <span className='bg-background/35 dark:text-muted-foreground text-zinc-700 rounded-sm backdrop-blur-lg relative z-10 px-2'>
            Or continue with
          </span>
        </div>

        <OAuthButton imageSrc='/google.svg' provider='google' />
      </div>

      <div className='text-center text-sm'>
        Don&apos;t have an account?{" "}
        <Link href='/register' className='underline underline-offset-4'>
          Register
        </Link>
      </div>
    </form>
  );
}
