import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await User.findById(session.user.id);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Get all feedback notifications for all admins
    const feedbacks = await Notification.find({
      type: "feedback",
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        feedbacks,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json(
      { message: "Failed to fetch feedbacks", error: error.message },
      { status: 500 }
    );
  }
}
