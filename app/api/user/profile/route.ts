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

        const { name } = await req.json();

        if (!name || name.trim().length < 2) {
            return NextResponse.json({ message: "Name must be at least 2 characters" }, { status: 400 });
        }

        await connectDB();

        await User.findByIdAndUpdate(session.user.id, {
            name: name.trim(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
