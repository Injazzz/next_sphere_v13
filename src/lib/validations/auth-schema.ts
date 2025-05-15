import { z } from "zod";

// Password strength validation
const passwordChecks = {
  min: 8,
  max: 100,
  uppercase: 1,
  lowercase: 1,
  number: 1,
  symbol: 1,
};

// Custom error messages
const errorMessages = {
  name: {
    required: "Name is required",
    min: "Name must be at least 2 characters",
    max: "Name cannot exceed 50 characters",
  },
  email: {
    required: "Email is required",
    invalid: "Please enter a valid email address",
  },
  password: {
    required: "Password is required",
    min: `Password must be at least ${passwordChecks.min} characters`,
    max: `Password cannot exceed ${passwordChecks.max} characters`,
    uppercase: `Password must contain at least ${passwordChecks.uppercase} uppercase letter(s)`,
    lowercase: `Password must contain at least ${passwordChecks.lowercase} lowercase letter(s)`,
    number: `Password must contain at least ${passwordChecks.number} number(s)`,
    symbol: `Password must contain at least ${passwordChecks.symbol} special character(s)`,
  },
  confirmPassword: {
    match: "Passwords do not match",
  },
};

// Helper function to check password strength
const checkPasswordStrength = (password: string) => {
  const hasUpperCase =
    (password.match(/[A-Z]/g) || []).length >= passwordChecks.uppercase;
  const hasLowerCase =
    (password.match(/[a-z]/g) || []).length >= passwordChecks.lowercase;
  const hasNumber =
    (password.match(/[0-9]/g) || []).length >= passwordChecks.number;
  const hasSymbol =
    (password.match(/[^A-Za-z0-9]/g) || []).length >= passwordChecks.symbol;

  return {
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSymbol,
  };
};

// Base user schema
const baseUserSchema = z.object({
  email: z
    .string({
      required_error: errorMessages.email.required,
    })
    .email({
      message: errorMessages.email.invalid,
    })
    .toLowerCase()
    .trim(),
});

// Password schema with validation
const passwordSchema = z
  .string({
    required_error: errorMessages.password.required,
  })
  .min(passwordChecks.min, {
    message: errorMessages.password.min,
  })
  .max(passwordChecks.max, {
    message: errorMessages.password.max,
  })
  .refine((password) => checkPasswordStrength(password).hasUpperCase, {
    message: errorMessages.password.uppercase,
  })
  .refine((password) => checkPasswordStrength(password).hasLowerCase, {
    message: errorMessages.password.lowercase,
  })
  .refine((password) => checkPasswordStrength(password).hasNumber, {
    message: errorMessages.password.number,
  })
  .refine((password) => checkPasswordStrength(password).hasSymbol, {
    message: errorMessages.password.symbol,
  });

// Sign-up schema with additional fields and validation
export const signUpSchema = baseUserSchema
  .extend({
    name: z
      .string({
        required_error: errorMessages.name.required,
      })
      .min(2, {
        message: errorMessages.name.min,
      })
      .max(50, {
        message: errorMessages.name.max,
      })
      .trim(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: errorMessages.confirmPassword.match,
    path: ["confirmPassword"],
  });

// Sign-in schema
export const signInSchema = baseUserSchema.extend({
  password: z.string({
    required_error: errorMessages.password.required,
  }),
});

// Exported types for TypeScript
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
