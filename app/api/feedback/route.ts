import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || message.trim() === "") {
      return NextResponse.json(
        { message: "Message is required" },
        { status: 400 }
      );
    }

    // Get user info from session
    const userName = session.user.name || "User";
    const userEmail = session.user.email || "Unknown";

    // Get all admin users
    const adminUsers = await User.find({ role: "admin" });

    // Create notifications for all admins
    const notifications = [];
    for (const admin of adminUsers) {
      const notification = await Notification.create({
        userId: admin._id,
        title: "New Feedback Received",
        message: `${userName} (${userEmail}): ${message}`,
        type: "feedback",
        read: false,
        link: "/admin/notifications?tab=feedbacks",
      });
      notifications.push(notification);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Feedback submitted successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { message: "Failed to submit feedback", error: error.message },
      { status: 500 }
    );
  }
}
