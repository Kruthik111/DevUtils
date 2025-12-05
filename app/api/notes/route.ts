import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Note from "@/lib/models/Note";
import Group from "@/lib/models/Group";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Fetch groups and notes for the user
        const groups = await Group.find({ userId: session.user.id });
        const notes = await Note.find({ userId: session.user.id });

        // If no groups exist, return default structure or empty
        // The frontend expects a specific structure, so we might need to construct it here
        // or return raw data and let frontend handle it.
        // For now, let's return the raw data and we'll adapt the frontend to use it.

        return NextResponse.json({ groups, notes });
    } catch (error) {
        console.error("Error fetching notes:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { type, data } = body; // type: 'note' | 'group' | 'tab' | 'sync'

        await connectDB();

        if (type === 'sync') {
            // Full sync - simpler for now given the complex frontend state
            // In a real app, we'd want more granular updates
            const { groups, notes } = data;

            // This is a destructive operation - be careful!
            // For this MVP, we'll update/upsert based on IDs

            // 1. Update Groups
            for (const group of groups) {
                await Group.findOneAndUpdate(
                    { id: group.id, userId: session.user.id },
                    { ...group, userId: session.user.id },
                    { upsert: true, new: true }
                );
            }

            // 2. Update Notes
            // We need to know which notes belong to which tab/group
            // The frontend sends nested structure. We should flatten it for storage if we want relational
            // OR just store the whole blob if we want document store style.
            // The Note model I defined earlier is relational (userId, groupId, tabId).

            // Let's assume the frontend sends a flattened list of notes or we extract them.
            // Actually, the frontend `data` state is nested: groups -> tabs -> notes.

            const allNotes = [];
            for (const group of groups) {
                for (const tab of group.tabs) {
                    for (const note of tab.notes) {
                        allNotes.push({
                            ...note,
                            userId: session.user.id,
                            groupId: group.id,
                            tabId: tab.id
                        });
                    }
                }
            }

            for (const note of allNotes) {
                await Note.findOneAndUpdate(
                    { id: note.id, userId: session.user.id },
                    note,
                    { upsert: true, new: true }
                );
            }

            // Handle deletions? 
            // For now, let's just upsert. Deletions might need a separate API call or a "deleted" flag.

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ message: "Invalid operation" }, { status: 400 });
    } catch (error) {
        console.error("Error saving notes:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
