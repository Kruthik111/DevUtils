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
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { message: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Get all admin users
    const adminUsers = await User.find({ role: "admin" });

    // Create notifications for all admins
    const notifications = [];
    for (const admin of adminUsers) {
      const notification = await Notification.create({
        userId: admin._id,
        title: "New Feedback Received",
        message: `${name} (${email}): ${message.substring(0, 100)}${message.length > 100 ? "..." : ""}`,
        type: "info",
        read: false,
        link: null,
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
