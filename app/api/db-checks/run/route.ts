import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import DbCheck from "@/lib/models/DbCheck";
import User from "@/lib/models/User";
import { Types } from "mongoose";

async function checkAccess(userId: string): Promise<boolean> {
  await connectDB();
  if (!Types.ObjectId.isValid(userId)) return false;
  const user = await User.findById(userId);
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.hasAccess?.includes("/db-check") || false;
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
    const { id, params } = body;
    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    await connectDB();
    const config = await DbCheck.findOne({ _id: id, userId });
    if (!config) {
      return NextResponse.json({ message: "DB check not found" }, { status: 404 });
    }

    const mergedParams = { ...(config.paramsTemplate || {}), ...(params || {}) };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.token) {
      headers["Authorization"] = `Bearer ${config.token}`;
    }

    const response = await fetch(config.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(mergedParams),
    });

    const text = await response.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      // non-JSON response
    }

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: json ?? text,
    }, { status: response.ok ? 200 : response.status });
  } catch (error) {
    console.error("Error running db check:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

