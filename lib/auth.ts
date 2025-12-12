import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { compare } from "bcryptjs";

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
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
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
