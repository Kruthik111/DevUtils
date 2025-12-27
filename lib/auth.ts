import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { compare } from "bcryptjs";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // Add this line - allows localhost and other hosts
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        await connectDB();

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await User.findOne({ email: credentials.email }).select("+password");

        if (!user) {
          return null;
        }

        // Check if user is suspended (handle undefined case)
        if (user.suspended === true) {
          return null; // Suspended users cannot login
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Set admin role for specific email
        if (user.email === 'gokruthik2003@gmail.com' && user.role !== 'admin') {
          await User.findByIdAndUpdate(user._id, { role: 'admin' });
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    ...(googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/signin",
    error: "/signin", // redirect auth errors to sign-in page for friendly messaging
  },
  callbacks: {
    async signIn({ user, account }) {
      // Link Google sign-ins to existing email/password accounts
      if (account?.provider === "google") {
        await connectDB();

        if (!user.email) {
          return false;
        }

        const existingUser = await User.findOne({ email: user.email.toLowerCase() });
        if (!existingUser) {
          // Require the user to already exist (migrating to Google only)
          return false;
        }

        if (existingUser.suspended === true) {
          return false;
        }

        // Reuse the existing account data for the JWT/session
        user.id = existingUser._id.toString();
        user.name = existingUser.name;
        user.email = existingUser.email;
        user.image = existingUser.image;
      }

      return true;
    },
    async session({ session, token, trigger, newSession }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }

      // Handle session updates (when update() is called)
      if (trigger === "update" && newSession?.name) {
        session.user.name = newSession.name;
      }

      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = (user as any).image;
      }

      // Handle token updates (when update() is called)
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }

      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
});
