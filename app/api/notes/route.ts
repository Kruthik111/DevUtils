import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Note from "@/lib/models/Note";
import Group from "@/lib/models/Group";
import User from "@/lib/models/User";

// Check if user has access to notes page
async function checkAccess(userId: string): Promise<boolean> {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return false;
    
    // Admin has access to everything
    if (user.role === 'admin') return true;
    
    // Check if user has access to /notes page
    return user.hasAccess?.includes('/notes') || false;
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Check access
        const hasAccess = await checkAccess(session.user.id);
        if (!hasAccess) {
            return NextResponse.json({ message: "Access denied" }, { status: 403 });
        }

        // Fetch groups and notes for the user (exclude soft-deleted notes)
        const groups = await Group.find({ userId: session.user.id });
        const notes = await Note.find({ 
            userId: session.user.id,
            deleted: { $ne: true } // Exclude soft-deleted notes
        });

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

        await connectDB();

        // Check access
        const hasAccess = await checkAccess(session.user.id);
        if (!hasAccess) {
            return NextResponse.json({ message: "Access denied" }, { status: 403 });
        }

        const body = await req.json();
        const { type, data } = body; // type: 'note' | 'group' | 'tab' | 'sync'

        if (type === 'sync') {
            // Full sync - simpler for now given the complex frontend state
            // In a real app, we'd want more granular updates
            const { groups, notes } = data;

            // This is a destructive operation - be careful!
            // For this MVP, we'll update/upsert based on IDs

            // 1. Update Groups
            for (const group of groups) {
                try {
                    await Group.findOneAndUpdate(
                        { id: group.id, userId: session.user.id },
                        { ...group, userId: session.user.id },
                        { upsert: true, new: true }
                    );
                } catch (error: any) {
                    if (error.code === 11000) {
                        console.error(`Duplicate key error for group ${group.id}:`, error);
                        // If it's a duplicate key error on the 'id' field, it might be due to a global index
                        // We can try to recover or just log it for now.
                        // Since we are now generating unique IDs in the frontend/storage.ts, this should be rare for new data.
                        // For existing data, the user might need to drop the index.
                        return NextResponse.json({
                            message: "Duplicate key error. Please contact support or check database indexes.",
                            error: error.message
                        }, { status: 409 });
                    }
                    throw error;
                }
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
    } catch (error: any) {
        console.error("Error saving notes:", error);
        if (error.code === 11000) {
            return NextResponse.json({
                message: "Duplicate key error. Please check your data.",
                error: error.message
            }, { status: 409 });
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

        await connectDB();

        // Check access
        const hasAccess = await checkAccess(session.user.id);
        if (!hasAccess) {
            return NextResponse.json({ message: "Access denied" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const noteId = searchParams.get('id');

        if (!noteId) {
            return NextResponse.json({ message: "Note ID is required" }, { status: 400 });
        }

        // Soft delete the note
        const note = await Note.findOneAndUpdate(
            { id: noteId, userId: session.user.id },
            { 
                deleted: true,
                deletedAt: new Date()
            },
            { new: true }
        );

        if (!note) {
            return NextResponse.json({ message: "Note not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Note deleted successfully" });
    } catch (error) {
        console.error("Error deleting note:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
