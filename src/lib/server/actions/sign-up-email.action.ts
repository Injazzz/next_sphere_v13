/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { auth, ErrorCodes } from "@/lib/auth";
import { signUpSchema } from "@/lib/validations/auth-schema";
import { APIError } from "better-auth/api";

export async function signUpEmailServerAction(formData: FormData) {
  try {
    // Extract form data
    const userData = {
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      confirmPassword: String(formData.get("confirmPassword")),
    };

    // Validate with Zod schema
    const result = signUpSchema.safeParse(userData);

    // If validation fails, return the first error
    if (!result.success) {
      const formattedErrors = result.error.format();

      // Find the first error message
      let errorMessage = "Validation failed";

      if (formattedErrors._errors.length > 0) {
        errorMessage = formattedErrors._errors[0];
      } else if (
        formattedErrors.name?._errors &&
        formattedErrors.name._errors.length > 0
      ) {
        errorMessage = formattedErrors.name._errors[0];
      } else if (
        formattedErrors.email?._errors &&
        formattedErrors.email._errors.length > 0
      ) {
        errorMessage = formattedErrors.email._errors[0];
      } else if (
        formattedErrors.password?._errors &&
        formattedErrors.password._errors.length > 0
      ) {
        errorMessage = formattedErrors.password._errors[0];
      } else if (
        formattedErrors.confirmPassword?._errors &&
        formattedErrors.confirmPassword._errors.length > 0
      ) {
        errorMessage = formattedErrors.confirmPassword._errors[0];
      }

      return { error: errorMessage };
    }

    // Proceed with registration
    const { name, email, password } = result.data;

    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Registration error:", error);

    // Handle better-auth specific errors
    if (error instanceof APIError) {
      const errorCode = error.body
        ? (error.body.code as ErrorCodes)
        : "UNKNOWN";

      switch (errorCode) {
        case "USER_ALREADY_EXISTS":
          return { error: "Email already exist" };
        default:
          return { error: error.message };
      }
    }

    return { error: "An unexpected error occurred during registration" };
  }
}
