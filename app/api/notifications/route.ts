import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";

const NOTIFICATION_LIMIT = 12;

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user is admin
    const user = await User.findById(userId);
    const isAdmin = user?.role === 'admin';

    // Get notifications for the user
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(isAdmin ? 1000 : NOTIFICATION_LIMIT) // No limit for admin
      .lean();

    // Count unread notifications
    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { message: "Failed to fetch notifications", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, message, type = 'info', link = null } = body;

    if (!title || !message) {
      return NextResponse.json(
        { message: "Title and message are required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Check if user is admin
    const user = await User.findById(userId);
    const isAdmin = user?.role === 'admin';

    // Create notification
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      link,
      read: false,
    });

    // If not admin, enforce limit by deleting oldest
    if (!isAdmin) {
      const notificationCount = await Notification.countDocuments({ userId });
      if (notificationCount > NOTIFICATION_LIMIT) {
        // Find and delete the oldest notification
        const oldestNotification = await Notification.findOne({ userId })
          .sort({ createdAt: 1 })
          .limit(1);
        if (oldestNotification) {
          await Notification.findByIdAndDelete(oldestNotification._id);
        }
      }
    }

    return NextResponse.json(notification, { status: 201 });
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { message: "Failed to create notification", error: error.message },
      { status: 500 }
    );
  }
}
