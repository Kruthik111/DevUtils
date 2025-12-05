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

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            theme: user.theme,
            customTheme: user.customTheme,
        });
    } catch (error) {
        console.error("Error fetching preferences:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { theme, customTheme } = await req.json();

        await connectDB();

        await User.findByIdAndUpdate(session.user.id, {
            theme,
            customTheme,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating preferences:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
