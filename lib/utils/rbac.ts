import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

const PUBLIC_PAGES = ['/profile', '/notes', '/signin', '/login', '/sign-in'];

export async function checkPageAccess(pagePath: string): Promise<boolean> {
    // Public pages don't need access check
    if (PUBLIC_PAGES.some(path => pagePath.startsWith(path))) {
        return true;
    }

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return false;
        }

        await connectDB();
        const user = await User.findById(session.user.id);
        
        if (!user) return false;
        
        // Admin has access to everything
        if (user.role === 'admin') return true;
        
        // Check if user has access to this page
        return user.hasAccess?.includes(pagePath) || false;
    } catch (error) {
        console.error("Error checking page access:", error);
        return false;
    }
}

export async function isAdmin(): Promise<boolean> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return false;
        }

        await connectDB();
        const user = await User.findById(session.user.id);
        return user?.role === 'admin' || false;
    } catch (error) {
        return false;
    }
}

