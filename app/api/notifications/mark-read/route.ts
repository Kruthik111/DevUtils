import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Notification from "@/lib/models/Notification";
import { auth } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll = false } = body;

    const userId = session.user.id;

    if (markAll) {
      // Mark all notifications as read
      await Notification.updateMany(
        { userId, read: false },
        { $set: { read: true } }
      );
    } else if (notificationId) {
      // Mark specific notification as read
      const notification = await Notification.findOne({
        _id: notificationId,
        userId,
      });

      if (!notification) {
        return NextResponse.json(
          { message: "Notification not found" },
          { status: 404 }
        );
      }

      notification.read = true;
      await notification.save();
    } else {
      return NextResponse.json(
        { message: "notificationId or markAll is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { message: "Failed to mark notification as read", error: error.message },
      { status: 500 }
    );
  }
}
