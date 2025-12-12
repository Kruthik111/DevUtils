import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

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
        const { userId, suspended } = body;

        // Prevent suspending self
        if (userId === session.user.id) {
            return NextResponse.json({ message: "Cannot suspend yourself" }, { status: 400 });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { suspended: suspended || false },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Error updating user suspension:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

