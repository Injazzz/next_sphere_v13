"use client";

import { changePasswordServerAction } from "@/lib/server/actions/change-password.action";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Eye, EyeClosed, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader } from "../ui/loader";

export const ChangePasswordForm = () => {
  const [isPending, setIsPending] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword: string | undefined;
    newPassword: string | undefined;
    confirmPassword: string | undefined;
  }>({
    currentPassword: undefined,
    newPassword: undefined,
    confirmPassword: undefined,
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSymbol: false,
  });

  // Fungsi untuk memeriksa kekuatan password
  const checkPasswordStrength = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = (password.match(/[A-Z]/g) || []).length >= 1;
    const hasLowerCase = (password.match(/[a-z]/g) || []).length >= 1;
    const hasNumber = (password.match(/[0-9]/g) || []).length >= 1;
    const hasSymbol = (password.match(/[^A-Za-z0-9]/g) || []).length >= 1;

    // Hitung skor berdasarkan kriteria yang terpenuhi
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

  // Validasi password sesuai dengan kriteria registrasi
  const validatePassword = (password: string) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (password.length > 100) {
      return "Password cannot exceed 100 characters";
    }
    if ((password.match(/[A-Z]/g) || []).length < 1) {
      return "Password must contain at least 1 uppercase letter";
    }
    if ((password.match(/[a-z]/g) || []).length < 1) {
      return "Password must contain at least 1 lowercase letter";
    }
    if ((password.match(/[0-9]/g) || []).length < 1) {
      return "Password must contain at least 1 number";
    }
    if ((password.match(/[^A-Za-z0-9]/g) || []).length < 1) {
      return "Password must contain at least 1 special character";
    }
    return null;
  };

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const currentPassword = String(formData.get("currentPassword"));
    const newPassword = String(formData.get("newPassword"));
    const confirmPassword = String(formData.get("confirmPassword"));

    // Validasi current password
    if (!currentPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        currentPassword: "Current password is required",
      }));
      return toast.error("Current password is required");
    }

    // Validasi new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setFieldErrors((prev) => ({ ...prev, newPassword: passwordError }));
      return toast.error(passwordError);
    }

    // Validasi konfirmasi password
    if (newPassword !== confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
      return toast.error("Passwords do not match");
    }

    setIsPending(true);

    const { error } = await changePasswordServerAction(formData);

    if (error) {
      toast.error(error);
      setIsPending(false);
    } else {
      toast.success("Password changed successfully.");
      setIsPending(false);
      // Reset form
      (event.target as HTMLFormElement).reset();
      setPasswordStrength({
        score: 0,
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSymbol: false,
      });
    }
  }

  return (
    <form onSubmit={handlePasswordChange} className='w-full space-y-4 mt-5'>
      {/* Current Password field */}
      <div className='grid gap-3'>
        <Label
          htmlFor='currentPassword'
          className='flex items-center justify-between'
        >
          Current Password
          {fieldErrors.currentPassword && (
            <span className='text-destructive text-xs flex items-center'>
              <AlertCircle className='h-3 w-3 mr-1' />
              {fieldErrors.currentPassword}
            </span>
          )}
        </Label>
        <div className='relative'>
          <Input
            id='currentPassword'
            name='currentPassword'
            type={showCurrentPassword ? "text" : "password"}
            placeholder='••••••••'
            className={
              fieldErrors.currentPassword ? "border-destructive pr-10" : "pr-10"
            }
            onChange={() => {
              if (fieldErrors.currentPassword) {
                setFieldErrors((prev) => ({
                  ...prev,
                  currentPassword: undefined,
                }));
              }
            }}
            required
          />
          <button
            type='button'
            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500'
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? <Eye /> : <EyeClosed />}
          </button>
        </div>
      </div>

      {/* New Password field */}
      <div className='grid gap-3'>
        <Label
          htmlFor='newPassword'
          className='flex items-center justify-between'
        >
          New Password
          {fieldErrors.newPassword && (
            <span className='text-destructive text-xs flex items-center'>
              <AlertCircle className='h-3 w-3 mr-1' />
              {fieldErrors.newPassword}
            </span>
          )}
        </Label>
        <div className='relative'>
          <Input
            id='newPassword'
            name='newPassword'
            type={showNewPassword ? "text" : "password"}
            placeholder='••••••••'
            className={
              fieldErrors.newPassword ? "border-destructive pr-10" : "pr-10"
            }
            onChange={(e) => {
              checkPasswordStrength(e.target.value);
              if (fieldErrors.newPassword) {
                setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
              }
            }}
            required
          />
          <button
            type='button'
            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500'
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <Eye /> : <EyeClosed />}
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
          <p className='text-xs dark:text-muted-foreground text-zinc-700 mt-3'>
            {passwordStrength.score === 0 && "Password strength"}
            {passwordStrength.score === 1 && "Very weak"}
            {passwordStrength.score === 2 && "Weak"}
            {passwordStrength.score === 3 && "Medium"}
            {passwordStrength.score === 4 && "Strong"}
            {passwordStrength.score === 5 && "Very strong"}
          </p>
          <ul className='grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-2 text-xs'>
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
      <div className='grid gap-3'>
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
              fieldErrors.confirmPassword ? "border-destructive pr-10" : "pr-10"
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

      <Button type='submit' disabled={isPending} className='w-full mt-6'>
        {isPending ? <Loader /> : "Save changes"}
      </Button>
    </form>
  );
};
