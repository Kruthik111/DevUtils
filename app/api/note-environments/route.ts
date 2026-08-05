import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import NoteEnvironment from "@/lib/models/NoteEnvironment";

// Environments scoped to the Notes page only — separate from /api/environments,
// which belongs to the API testing page.
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const environments = await NoteEnvironment.find({ userId: session.user.id })
            .sort({ isDefault: -1, createdAt: -1 });

        return NextResponse.json({ environments });
    } catch (error) {
        console.error("Error fetching note environments:", error);
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

        const { name, variables, isDefault } = await req.json();

        if (!name?.trim()) {
            return NextResponse.json({ message: "Environment name is required" }, { status: 400 });
        }

        if (isDefault) {
            await NoteEnvironment.updateMany(
                { userId: session.user.id },
                { $set: { isDefault: false } }
            );
        }

        const environment = await NoteEnvironment.create({
            userId: session.user.id,
            name: name.trim(),
            variables: variables || {},
            isDefault: isDefault || false,
        });

        return NextResponse.json({ environment });
    } catch (error) {
        console.error("Error creating note environment:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { id, name, variables, isDefault } = await req.json();

        if (!id) {
            return NextResponse.json({ message: "Environment ID is required" }, { status: 400 });
        }

        if (isDefault) {
            await NoteEnvironment.updateMany(
                { userId: session.user.id, _id: { $ne: id } },
                { $set: { isDefault: false } }
            );
        }

        const environment = await NoteEnvironment.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            {
                name,
                variables: variables || {},
                isDefault: isDefault || false,
            },
            { new: true }
        );

        if (!environment) {
            return NextResponse.json({ message: "Environment not found" }, { status: 404 });
        }

        return NextResponse.json({ environment });
    } catch (error) {
        console.error("Error updating note environment:", error);
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

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: "Environment ID is required" }, { status: 400 });
        }

        const environment = await NoteEnvironment.findOneAndDelete({ _id: id, userId: session.user.id });

        if (!environment) {
            return NextResponse.json({ message: "Environment not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting note environment:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
