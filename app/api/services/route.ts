import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import Service from "@/lib/models/Service";

async function checkAccess(userId: string): Promise<boolean> {
  await connectDB();
  if (!Types.ObjectId.isValid(userId)) return false;
  const user = await User.findById(userId);
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.hasAccess?.includes("/handle-server") || false;
}

export async function GET(req: Request) {
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
    const docs = await Service.find({ userId }).sort({ name: 1 });
    const items = docs.map((doc: any) => ({
      _id: doc._id,
      userId: doc.userId,
      name: doc.name,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching services:", error);
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
    const { id, name } = body;

    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    await connectDB();

    if (id) {
      const updated = await Service.findOneAndUpdate(
        { _id: id, userId },
        { name },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ message: "Service not found" }, { status: 404 });
      }
      return NextResponse.json({ item: updated });
    }

    const created = await Service.create({
      userId,
      name,
    });

    return NextResponse.json({ item: created });
  } catch (error: any) {
    console.error("Error saving service:", error);
    if (error.code === 11000) {
      return NextResponse.json({ message: "Service with this name already exists" }, { status: 409 });
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
    const deleteAll = searchParams.get("all") === "true";
    const id = searchParams.get("id");

    await connectDB();

    if (deleteAll) {
      const user = await User.findById(userId);
      if (!user || user.role !== "admin") {
        return NextResponse.json({ message: "Admin access required" }, { status: 403 });
      }
      await Service.deleteMany({});
      return NextResponse.json({ success: true, deletedAll: true });
    }

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const deleted = await Service.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return NextResponse.json({ message: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

