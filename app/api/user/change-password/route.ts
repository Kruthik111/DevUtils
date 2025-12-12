import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { compare, hash } from "bcryptjs";

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ message: "Current password and new password are required" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ message: "New password must be at least 6 characters" }, { status: 400 });
        }

        await connectDB();

        const user = await User.findById(session.user.id).select("+password");
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const isPasswordValid = await compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });
        }

        const hashedPassword = await hash(newPassword, 10);
        await User.findByIdAndUpdate(session.user.id, {
            password: hashedPassword,
            passwordPlain: newPassword, // Store plain text for reference (if needed)
        });

        return NextResponse.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        console.error("Error changing password:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

