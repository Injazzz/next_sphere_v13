/* eslint-disable @typescript-eslint/no-explicit-any */
// sign-in-email.action.ts
"use server";

import { auth, ErrorCodes } from "@/lib/auth";
import { signInSchema } from "@/lib/validations/auth-schema";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signInEmailServerAction(formData: FormData) {
  try {
    // Extract form data
    const userData = {
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    };

    // Validate with Zod schema
    const result = signInSchema.safeParse(userData);

    // If validation fails, return the first error
    if (!result.success) {
      const formattedErrors = result.error.format();

      let errorMessage = "Validation failed";

      if (formattedErrors._errors.length > 0) {
        errorMessage = formattedErrors._errors[0];
      } else if (formattedErrors.email?._errors?.[0]) {
        errorMessage = formattedErrors.email._errors[0];
      } else if (formattedErrors.password?._errors?.[0]) {
        errorMessage = formattedErrors.password._errors[0];
      }

      return { error: errorMessage };
    }

    // Proceed with login
    const { email, password } = result.data;

    await auth.api.signInEmail({
      headers: await headers(),
      body: {
        email,
        password,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Login error:", error);

    // Handle better-auth specific errors
    if (error instanceof APIError) {
      const errorCode = error.body
        ? (error.body.code as ErrorCodes)
        : "UNKNOWN";

      switch (errorCode) {
        case "EMAIL_NOT_VERIFIED":
          redirect("/verify?error=email_not_verified");
        case "INVALID_EMAIL_OR_PASSWORD":
          return { error: "Invalid email or password." };
        default:
          return { error: error.message };
      }
    }

    return { error: "An unexpected error occurred during login" };
  }
}
