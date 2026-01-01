import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import DbCheck from "@/lib/models/DbCheck";

async function checkAccess(userId: string): Promise<boolean> {
  await connectDB();
  if (!Types.ObjectId.isValid(userId)) return false;
  const user = await User.findById(userId);
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.hasAccess?.includes("/db-check") || false;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const hasAccess = await checkAccess(userId);
    if (!hasAccess) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    await connectDB();
    const items = await DbCheck.find({ userId }).sort({ updatedAt: -1 });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching db checks:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const hasAccess = await checkAccess(userId);
    if (!hasAccess) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, endpoint, token, paramsTemplate } = body;

    if (!title || !endpoint) {
      return NextResponse.json({ message: "Title and endpoint are required" }, { status: 400 });
    }

    await connectDB();

    if (id) {
      const updated = await DbCheck.findOneAndUpdate(
        { _id: id, userId },
        { title, endpoint, token, paramsTemplate: paramsTemplate || {} },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ message: "DB check not found" }, { status: 404 });
      }
      return NextResponse.json({ item: updated });
    }

    const created = await DbCheck.create({
      userId,
      title,
      endpoint,
      token,
      paramsTemplate: paramsTemplate || {},
    });

    return NextResponse.json({ item: created });
  } catch (error: any) {
    console.error("Error saving db check:", error);
    if (error.code === 11000) {
      return NextResponse.json({ message: "Title already exists" }, { status: 409 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const hasAccess = await checkAccess(userId);
    if (!hasAccess) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    await connectDB();
    const deleted = await DbCheck.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return NextResponse.json({ message: "DB check not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting db check:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

