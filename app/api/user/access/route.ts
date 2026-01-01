import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select("hasAccess role");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      hasAccess: user.hasAccess || [],
      role: user.role,
    });
  } catch (error) {
    console.error("Error fetching user access:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

