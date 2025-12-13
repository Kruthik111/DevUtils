import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import Note from "@/lib/models/Note";
import Group from "@/lib/models/Group";
import ApiConfig from "@/lib/models/ApiConfig";
import Environment from "@/lib/models/Environment";

export async function DELETE(req: Request) {
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

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ message: "User ID is required" }, { status: 400 });
        }

        // Prevent deleting self
        if (userId === session.user.id) {
            return NextResponse.json({ message: "Cannot delete yourself" }, { status: 400 });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Delete all notes for the user
        await Note.deleteMany({ userId: userId });

        // Delete all groups for the user
        await Group.deleteMany({ userId: userId });

        // Delete all API configs for the user
        await ApiConfig.deleteMany({ userId: userId });

        // Delete all environments for the user
        await Environment.deleteMany({ userId: userId });

        // Mark user as suspended
        await User.findByIdAndUpdate(
            userId,
            { suspended: true },
            { new: true }
        );

        return NextResponse.json({ 
            message: "User data deleted and account suspended successfully",
            userId 
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

