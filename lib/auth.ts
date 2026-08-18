import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { compare, hash } from "bcryptjs";

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
      // Link Google sign-ins to existing accounts; create one if missing
      if (account?.provider === "google") {
        await connectDB();

        if (!user.email) {
          return false;
        }

        const existingUser = await User.findOne({ email: user.email.toLowerCase() });

        if (existingUser) {
          if (existingUser.suspended === true) {
            return false;
          }

          user.id = existingUser._id.toString();
          user.name = existingUser.name;
          user.email = existingUser.email;
          user.image = existingUser.image;

          // Ensure admin role for specific email
          if (existingUser.email === 'gokruthik2003@gmail.com' && existingUser.role !== 'admin') {
            await User.findByIdAndUpdate(existingUser._id, { role: 'admin' });
          }

          return true;
        }

        // Create new user from Google profile
        const randomPassword = `google-${Math.random().toString(36).slice(2)}`;
        const hashed = await hash(randomPassword, 10);

        const created = await User.create({
          email: user.email.toLowerCase(),
          name: user.name || user.email.split("@")[0],
          image: user.image,
          password: hashed,
          passwordPlain: undefined,
          role: user.email.toLowerCase() === 'gokruthik2003@gmail.com' ? "admin" : "user",
          hasAccess: ["/notes"], // default access; adjust if needed
          suspended: false,
        });

        user.id = created._id.toString();
        user.name = created.name;
        user.email = created.email;
        user.image = created.image;

        // Create notification for admin users about new user signup
        const Notification = (await import("@/lib/models/Notification")).default;
        const adminUsers = await User.find({ role: "admin" });
        
        for (const admin of adminUsers) {
          await Notification.create({
            userId: admin._id,
            title: "New User Signed Up",
            message: `${created.name} (${created.email}) has signed up`,
            type: "user_signup",
            read: false,
            link: `/admin/users`,
          });
        }

        // Send welcome notification to the new user
        await Notification.create({
          userId: created._id,
          title: "Welcome to DevUtils!",
          message: `Welcome ${created.name}! We're excited to have you on board. Start by exploring the Notes feature and API testing tools.`,
          type: "success",
          read: false,
          link: `/notes`,
        });
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

      // Track last activity, at most once every 15 minutes per session
      const now = Date.now();
      if (token.sub && now - ((token.lastActive as number) || 0) > 15 * 60 * 1000) {
        token.lastActive = now;
        try {
          await connectDB();
          await User.updateOne({ _id: token.sub }, { lastActive: new Date(now) });
        } catch {
          // activity tracking is best-effort
        }
      }

      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
});
