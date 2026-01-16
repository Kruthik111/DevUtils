import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";

const NOTIFICATION_LIMIT = 12;

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await User.findById(session.user.id);
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, message, type = "info", link = null, userIds = null } = body;

    if (!title || !message) {
      return NextResponse.json(
        { message: "Title and message are required" },
        { status: 400 }
      );
    }

    let targetUsers: any[] = [];

    if (userIds === null || userIds === "all") {
      // Send to all users
      targetUsers = await User.find({ role: "user" }).select("_id");
    } else if (Array.isArray(userIds) && userIds.length > 0) {
      // Send to specific users
      targetUsers = await User.find({
        _id: { $in: userIds },
      }).select("_id");
    } else {
      return NextResponse.json(
        { message: "Invalid userIds parameter" },
        { status: 400 }
      );
    }

    const notifications = [];
    for (const user of targetUsers) {
      // Create notification
      const notification = await Notification.create({
        userId: user._id,
        title,
        message,
        type,
        link,
        read: false,
      });

      // Check if user is admin (no limit) or regular user (12 limit)
      const userDoc = await User.findById(user._id);
      const isAdmin = userDoc?.role === "admin";

      // If not admin, enforce limit by deleting oldest
      if (!isAdmin) {
        const notificationCount = await Notification.countDocuments({
          userId: user._id,
        });
        if (notificationCount > NOTIFICATION_LIMIT) {
          // Find and delete the oldest notification
          const oldestNotification = await Notification.findOne({
            userId: user._id,
          })
            .sort({ createdAt: 1 })
            .limit(1);
          if (oldestNotification) {
            await Notification.findByIdAndDelete(oldestNotification._id);
          }
        }
      }

      notifications.push(notification);
    }

    return NextResponse.json(
      {
        success: true,
        count: notifications.length,
        notifications,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating notifications:", error);
    return NextResponse.json(
      { message: "Failed to create notifications", error: error.message },
      { status: 500 }
    );
  }
}
