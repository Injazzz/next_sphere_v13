import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  plugins: [magicLinkClient()],
});

export const {
  signUp,
  signOut,
  signIn,
  useSession,
  getSession,
  sendVerificationEmail,
  forgetPassword,
  resetPassword,
  updateUser,
  magicLink, // Export the magicLink functionality
} = authClient;
