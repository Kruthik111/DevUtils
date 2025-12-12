import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Check if user is admin
        const user = await User.findById(session.user.id);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ message: "Admin access required" }, { status: 403 });
        }

        // Get all users
        const users = await User.find({}, { email: 1, name: 1, role: 1, hasAccess: 1 });

        return NextResponse.json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Check if user is admin
        const admin = await User.findById(session.user.id);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ message: "Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { userId, hasAccess } = body;

        const user = await User.findByIdAndUpdate(
            userId,
            { hasAccess: hasAccess || [] },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Error updating user access:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

