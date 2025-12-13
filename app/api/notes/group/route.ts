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
        const groupId = searchParams.get('id');

        if (!groupId) {
            return NextResponse.json({ message: "Group ID is required" }, { status: 400 });
        }

        // Prevent deletion of work group
        if (groupId.startsWith('work-')) {
            return NextResponse.json({ message: "Cannot delete the 'Work' group" }, { status: 400 });
        }

        // Find the group to ensure it belongs to the user
        const group = await Group.findOne({ id: groupId, userId: session.user.id });
        if (!group) {
            return NextResponse.json({ message: "Group not found" }, { status: 404 });
        }

        // Delete all notes in this group
        await Note.deleteMany({ 
            userId: session.user.id,
            groupId: groupId 
        });

        // Delete the group
        await Group.deleteOne({ id: groupId, userId: session.user.id });

        return NextResponse.json({ 
            success: true, 
            message: "Group and all its notes deleted successfully" 
        });
    } catch (error) {
        console.error("Error deleting group:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

