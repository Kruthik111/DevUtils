import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Group from "@/lib/models/Group";
import Note from "@/lib/models/Note";

type IncomingTab = {
  id: string;
  name: string;
};

type IncomingGroup = {
  id: string;
  name: string;
  tabs: IncomingTab[];
};

type IncomingNote = {
  id: string;
  title: string;
  blocks: any[];
  groupId?: string | null;
  tabId?: string | null;
  pin?: number | null;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
};

function sanitizeGroups(groups: any[]) {
  return groups.map(({ _id, __v, userId, createdAt, updatedAt, ...rest }) => rest);
}

function sanitizeNotes(notes: any[]) {
  return notes.map(({ _id, __v, userId, createdAt, updatedAt, ...rest }) => ({
    ...rest,
    createdAt,
    updatedAt,
  }));
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    await connectDB();

    const groups = await Group.find({ userId }).lean();
    const notes = await Note.find({ userId, deleted: { $ne: true } }).lean();

    return NextResponse.json({
      groups: sanitizeGroups(groups),
      notes: sanitizeNotes(notes),
    });
  } catch (error) {
    console.error("Error exporting notes backup:", error);
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

    await connectDB();

    const body = await req.json();
    const { groups, notes } = body ?? {};

    if (!Array.isArray(groups) || !Array.isArray(notes)) {
      return NextResponse.json(
        { message: "Invalid payload. Expected { groups: [], notes: [] }." },
        { status: 400 }
      );
    }

    const userObjectId = new Types.ObjectId(userId);

    // Remap IDs to avoid collisions
    const groupIdMap = new Map<string, string>();
    const tabIdMap = new Map<string, string>();

    const groupsToInsert = (groups as IncomingGroup[]).map((group) => {
      const newGroupId = `group-${randomUUID()}`;
      groupIdMap.set(group.id, newGroupId);

      const newTabs = (group.tabs || []).map((tab) => {
        const newTabId = `tab-${randomUUID()}`;
        tabIdMap.set(tab.id, newTabId);
        return {
          id: newTabId,
          name: tab.name || "Untitled Tab",
        };
      });

      return {
        userId: userObjectId,
        id: newGroupId,
        name: group.name || "Untitled Group",
        tabs: newTabs,
      };
    });

    const notesToInsert = (notes as IncomingNote[]).map((note) => {
      const newNoteId = `note-${randomUUID()}`;
      const mappedGroupId = note.groupId ? groupIdMap.get(note.groupId) : null;
      const mappedTabId = note.tabId ? tabIdMap.get(note.tabId) : null;

      return {
        userId: userObjectId,
        id: newNoteId,
        title: note.title || "Untitled Note",
        blocks: Array.isArray(note.blocks) ? note.blocks : [],
        groupId: mappedGroupId || null,
        tabId: mappedTabId || null,
        pin: note.pin != null && note.pin > 0 ? note.pin : null,
        deleted: false,
        createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
        updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
      };
    });

    if (groupsToInsert.length > 0) {
      await Group.insertMany(groupsToInsert);
    }

    if (notesToInsert.length > 0) {
      await Note.insertMany(notesToInsert);
    }

    return NextResponse.json({
      success: true,
      groupsImported: groupsToInsert.length,
      notesImported: notesToInsert.length,
    });
  } catch (error) {
    console.error("Error importing notes backup:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

