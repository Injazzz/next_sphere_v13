import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { validator } from "validation-better-auth";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "./argon2";
import { signInSchema, signUpSchema } from "@/lib/validations/auth-schema";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { getValidDomain, normalizeUsername } from "./server-utils";
import { sendEmailServerAction } from "./server/actions/send-mail.action";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: false,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 60 * 15,
    sendResetPassword: async ({ user, url }) => {
      await sendEmailServerAction({
        to: user.email,
        subject: "Reset your password",
        meta: {
          title: "Reset Password",
          description: "Please click link below to reset your password.",
          link: String(url),
          buttonText: "Reset Password",
          footer: "If you didn't request this email, you can safely ignore it.",
        },
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    expiresIn: 60 * 15, // 15 minutes
    autoSignInAfterVerification: false,
    afterVerification: "/verify",
    sendVerificationEmail: async ({ user, url }) => {
      let modifiedUrl = url;

      // Ganti parameter callbackURL di URL jika ada
      if (url.includes("callbackURL=")) {
        modifiedUrl = url.replace(
          /callbackURL=\/(.*?)(&|$)/,
          "callbackURL=/verify$2"
        );
      } else {
        // Tambahkan parameter callbackURL jika belum ada
        const separator = url.includes("?") ? "&" : "?";
        modifiedUrl = `${url}${separator}callbackURL=/verify`;
      }
      await sendEmailServerAction({
        to: user.email,
        subject: "Verify your email address",
        meta: {
          title: "Email Verification",
          description:
            "Please verify your email address to complete registration",
          link: String(modifiedUrl),
          buttonText: "Verify Email Address",
          footer: "If you didn't request this email, you can safely ignore it.",
        },
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  account: {
    accountLinking: {
      enabled: false,
    },
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path == "/sign-up/email") {
        const email = String(ctx.body.email);
        const domain = email.split("@")[1];

        const validDomain = getValidDomain();

        if (!validDomain.includes(domain)) {
          throw new APIError("BAD_REQUEST", {
            message: "Invalid domain. Please use a valid email.",
          });
        }

        const name = normalizeUsername(ctx.body.name);

        return {
          context: {
            ...ctx,
            body: {
              ...ctx.body,
              name,
            },
          },
        };
      }
    }),
  },
  plugins: [
    nextCookies(),
    validator([
      {
        path: "/sign-up/email",
        schema: signUpSchema,
        before: (ctx) => {
          // Pre-validation hook
          console.log("Pre-validation context for signup:", ctx.body);
          // You can modify the request context before validation
        },
        after: (ctx) => {
          // Post-validation hook
          console.log("Post-validation context for signup:", ctx.body);
          // You can perform additional operations after successful validation
        },
      },
      {
        path: "/sign-in/email",
        schema: signInSchema,
        before: (ctx) => {
          console.log("Pre-validation context for signin:", ctx.body);
        },
        after: (ctx) => {
          console.log("Post-validation context for signin:", ctx.body);
        },
      },
    ]),
    magicLink({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      sendMagicLink: async ({ email, token, url }, request) => {
        // Verify this is a client email first
        const client = await prisma.client.findUnique({
          where: { email },
        });

        if (!client) {
          throw new APIError("BAD_REQUEST", {
            message: "Email not found in our client records",
          });
        }

        await sendEmailServerAction({
          to: email,
          subject: "Access your documents",
          meta: {
            title: "Document Access Link",
            description: "Click the link below to access your documents",
            link: String(url),
            buttonText: "Access Documents",
            footer:
              "If you didn't request this email, you can safely ignore it.",
          },
        });
      },
      // Magic link expires in 30 minutes
      expiresIn: 60 * 30,
      // Don't create new accounts if the email doesn't exist
      disableSignUp: true,
    }),
  ],
});

export type ErrorCodes = keyof typeof auth.$ERROR_CODES | "UNKNOWN";
