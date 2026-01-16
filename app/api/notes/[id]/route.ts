import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Note from "@/lib/models/Note";
import mongoose from "mongoose";

// Update a single note
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { id: noteId } = await params;
        const body = await req.json();
        
        // Extract note data
        const {
            title,
            blocks,
            pin,
            groupId,
            tabId,
            createdAt,
            updatedAt,
        } = body;

        // Build update object
        const updateData: any = {
            title,
            blocks,
            groupId: groupId || null,
            tabId: tabId || null,
            updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
        };

        // Handle createdAt if provided
        if (createdAt) {
            updateData.createdAt = typeof createdAt === 'number' 
                ? new Date(createdAt) 
                : createdAt;
        }

        // Explicitly set pin field - always include it
        // Handle both number and string inputs (in case frontend sends string)
        let pinValue: number | null = null;
        if (pin != null) {
            if (typeof pin === 'string') {
                const parsed = parseInt(pin, 10);
                pinValue = (!isNaN(parsed) && parsed > 0) ? parsed : null;
            } else if (typeof pin === 'number') {
                pinValue = (pin > 0) ? pin : null;
            }
        }
        
        // Always explicitly set pin field (even if null)
        updateData.pin = pinValue;

        // Convert userId to ObjectId if it's a string
        let userId: mongoose.Types.ObjectId;
        try {
            userId = typeof session.user.id === 'string' 
                ? new mongoose.Types.ObjectId(session.user.id)
                : session.user.id;
        } catch (error) {
            console.error("Invalid userId format:", session.user.id);
            return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
        }

        // Check if note exists
        const existingNote = await Note.findOne({ id: noteId, userId });
        if (!existingNote) {
            return NextResponse.json({ message: "Note not found" }, { status: 404 });
        }

        // Build the update query - explicitly include pin field
        const updateQuery: any = {
            $set: {
                title: updateData.title,
                blocks: updateData.blocks,
                groupId: updateData.groupId,
                tabId: updateData.tabId,
                updatedAt: updateData.updatedAt,
                // Explicitly set pin field - this is critical
                pin: updateData.pin
            }
        };
        
        // Include createdAt if provided
        if (updateData.createdAt) {
            updateQuery.$set.createdAt = updateData.createdAt;
        }
        
        // Update the note
        const updatedNote = await Note.findOneAndUpdate(
            { id: noteId, userId },
            updateQuery,
            { new: true, runValidators: false, setDefaultsOnInsert: false }
        );

        if (!updatedNote) {
            return NextResponse.json({ message: "Note not found" }, { status: 404 });
        }

        // Force save to ensure pin is persisted
        if (updateData.pin !== undefined) {
            updatedNote.pin = updateData.pin;
            await updatedNote.save();
        }

        return NextResponse.json({ 
            success: true, 
            note: updatedNote 
        });
    } catch (error: any) {
        console.error("Error updating note:", error);
        return NextResponse.json({ 
            message: "Internal server error",
            error: error.message 
        }, { status: 500 });
    }
}

