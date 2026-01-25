import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Environment from "@/lib/models/Environment";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Get all environments for the user, with default first
        const environments = await Environment.find({ userId: session.user.id })
            .sort({ isDefault: -1, createdAt: -1 });

        return NextResponse.json({ environments });
    } catch (error) {
        console.error("Error fetching environments:", error);
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

        const body = await req.json();
        const { name, variables, isDefault } = body;

        // If this is set as default, unset other defaults for this user
        if (isDefault) {
            await Environment.updateMany(
                { userId: session.user.id },
                { $set: { isDefault: false } }
            );
        }

        const environment = await Environment.create({
            userId: session.user.id,
            name,
            variables: variables || {},
            isDefault: isDefault || false,
        });

        return NextResponse.json({ environment });
    } catch (error) {
        console.error("Error creating environment:", error);
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

        const body = await req.json();
        const { id, name, variables, isDefault } = body;

        // If this is set as default, unset other defaults for this user
        if (isDefault) {
            await Environment.updateMany(
                { userId: session.user.id, _id: { $ne: id } },
                { $set: { isDefault: false } }
            );
        }

        const environment = await Environment.findOneAndUpdate(
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
        console.error("Error updating environment:", error);
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

        const environment = await Environment.findOneAndDelete({ _id: id, userId: session.user.id });

        if (!environment) {
            return NextResponse.json({ message: "Environment not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting environment:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
