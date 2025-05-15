"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signUpEmailServerAction } from "@/lib/server/actions/sign-up-email.action";
import { AlertCircle, Eye, EyeClosed } from "lucide-react";
import { OAuthButton } from "../ui/oauth-button";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegisterSuccess, setIsRegisterSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Password strength indicator state
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSymbol: false,
  });

  // Function to check password strength as user types
  const checkPasswordStrength = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    // Calculate score (0-5)
    let score = 0;
    if (hasMinLength) score++;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;
    if (hasNumber) score++;
    if (hasSymbol) score++;

    setPasswordStrength({
      score,
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSymbol,
    });
  };

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isRegisterSuccess) {
      const redirectTimer = setTimeout(() => {
        window.location.reload();
      }, 1000);
      return () => clearTimeout(redirectTimer);
    }
  }, [isRegisterSuccess]);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    const formData = new FormData(event.target as HTMLFormElement);
    const { error, success } = await signUpEmailServerAction(formData);

    if (error) {
      // Try to determine which field the error belongs to
      const errorLower = error.toLowerCase();
      const newFieldErrors = { ...fieldErrors };

      if (errorLower.includes("name")) {
        newFieldErrors.name = error;
      } else if (errorLower.includes("email")) {
        newFieldErrors.email = error;
      } else if (
        errorLower.includes("password") &&
        errorLower.includes("match")
      ) {
        newFieldErrors.confirmPassword = error;
      } else if (errorLower.includes("password")) {
        newFieldErrors.password = error;
      }

      setFieldErrors(newFieldErrors);
      toast.error(error);
      setIsSubmitting(false);
    } else if (success) {
      toast.success("Registration successful! PLease check your email..");
      setIsRegisterSuccess(true);
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={handleRegister}
    >
      <div className='flex flex-col items-center gap-2 text-center'>
        <h1 className='text-4xl font-bold font-pacifico'>
          Register new account
        </h1>
        <p className='dark:text-muted-foreground text-zinc-700 text-sm text-balance mt-4'>
          Fill this blank input below for registering your account
        </p>
      </div>
      <div className='grid gap-6'>
        {/* Name field */}
        <div className='grid gap-2'>
          <Label htmlFor='name' className='flex items-center justify-between'>
            Name
            {fieldErrors.name && (
              <span className='text-destructive text-xs flex items-center'>
                <AlertCircle className='h-3 w-3 mr-1' />
                {fieldErrors.name}
              </span>
            )}
          </Label>
          <Input
            id='name'
            name='name'
            type='text'
            placeholder='John Doe'
            className={fieldErrors.name ? "border-destructive" : ""}
            onChange={() => {
              if (fieldErrors.name) {
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            required
          />
        </div>

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
          <div className='relative'>
            <Input
              id='password'
              name='password'
              type={showPassword ? "text" : "password"}
              placeholder='••••••••'
              className={
                fieldErrors.password ? "border-destructive pr-10" : "pr-10"
              }
              onChange={(e) => {
                checkPasswordStrength(e.target.value);
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

          {/* Password strength indicator */}
          <div className='mt-2 px-1'>
            <div className='flex gap-1 mb-1'>
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={cn("h-1 w-full rounded-sm", {
                    "bg-red-500": passwordStrength.score === 1 && level === 1,
                    "bg-orange-500": passwordStrength.score === 2 && level <= 2,
                    "bg-yellow-500": passwordStrength.score === 3 && level <= 3,
                    "bg-lime-500": passwordStrength.score === 4 && level <= 4,
                    "bg-green-800 dark:bg-green-500":
                      passwordStrength.score === 5 && level <= 5,
                    "bg-gray-200": level > passwordStrength.score,
                  })}
                />
              ))}
            </div>
            <p className='text-xs dark:text-muted-foreground text-zinc-700 mt-2'>
              {passwordStrength.score === 0 && "Password strength"}
              {passwordStrength.score === 1 && "Very weak"}
              {passwordStrength.score === 2 && "Weak"}
              {passwordStrength.score === 3 && "Medium"}
              {passwordStrength.score === 4 && "Strong"}
              {passwordStrength.score === 5 && "Very strong"}
            </p>
            <ul className='grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs'>
              {/* Gunakan flex untuk setiap item list */}
              <li
                className={`flex items-start ${
                  passwordStrength.hasMinLength
                    ? "text-green-800 dark:text-green-500"
                    : "dark:text-muted-foreground text-zinc-700"
                }`}
              >
                <span className='flex-shrink-0 mr-1'>✓</span>
                <span>At least 8 characters</span>
              </li>
              <li
                className={`flex items-start ${
                  passwordStrength.hasUpperCase
                    ? "text-green-800 dark:text-green-500"
                    : "dark:text-muted-foreground text-zinc-700"
                }`}
              >
                <span className='flex-shrink-0 mr-1'>✓</span>
                <span>At least 1 uppercase letter</span>
              </li>
              <li
                className={`flex items-start ${
                  passwordStrength.hasLowerCase
                    ? "text-green-800 dark:text-green-500"
                    : "dark:text-muted-foreground text-zinc-700"
                }`}
              >
                <span className='flex-shrink-0 mr-1'>✓</span>
                <span>At least 1 lowercase letter</span>
              </li>
              <li
                className={`flex items-start ${
                  passwordStrength.hasNumber
                    ? "text-green-800 dark:text-green-500"
                    : "dark:text-muted-foreground text-zinc-700"
                }`}
              >
                <span className='flex-shrink-0 mr-1'>✓</span>
                <span>At least 1 number</span>
              </li>
              <li
                className={`flex items-start ${
                  passwordStrength.hasSymbol
                    ? "text-green-800 dark:text-green-500"
                    : "dark:text-muted-foreground text-zinc-700"
                }`}
              >
                <span className='flex-shrink-0 mr-1'>✓</span>
                <span>At least 1 special character</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Confirm Password field */}
        <div className='grid gap-2'>
          <Label
            htmlFor='confirmPassword'
            className='flex items-center justify-between'
          >
            Confirm Password
            {fieldErrors.confirmPassword && (
              <span className='text-destructive text-xs flex items-center'>
                <AlertCircle className='h-3 w-3 mr-1' />
                {fieldErrors.confirmPassword}
              </span>
            )}
          </Label>
          <div className='relative'>
            <Input
              id='confirmPassword'
              name='confirmPassword'
              type={showConfirmPassword ? "text" : "password"}
              placeholder='••••••••'
              className={
                fieldErrors.confirmPassword
                  ? "border-destructive pr-10"
                  : "pr-10"
              }
              onChange={() => {
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                  }));
                }
              }}
              required
            />
            <button
              type='button'
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500'
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <Eye /> : <EyeClosed />}
            </button>
          </div>
        </div>

        <Button type='submit' className='w-full' disabled={isSubmitting}>
          {isSubmitting ? "Registering..." : "Register"}
        </Button>

        <div className='after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t'>
          <span className='bg-background/35 dark:text-muted-foreground text-zinc-700 rounded-sm backdrop-blur-2xl relative z-10 px-2'>
            Or continue with
          </span>
        </div>

        <OAuthButton imageSrc='/google.svg' provider='google' signUp />
      </div>

      <div className='text-center text-sm'>
        Already have an account?{" "}
        <Link href='/login' className='underline underline-offset-4'>
          Login
        </Link>
      </div>
    </form>
  );
}
