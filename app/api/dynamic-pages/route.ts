import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import DynamicPage from "@/lib/models/DynamicPage";
import { MAX_PAGES_PER_USER } from "@/lib/dynamic-pages/types";

// CRUD for user-configured API pages. Each user may keep MAX_PAGES_PER_USER.
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            const page = await DynamicPage.findOne({ _id: id, userId: session.user.id });
            if (!page) {
                return NextResponse.json({ message: "Page not found" }, { status: 404 });
            }
            return NextResponse.json({ page });
        }

        const pages = await DynamicPage.find({ userId: session.user.id }).sort({ updatedAt: -1 });
        return NextResponse.json({ pages, limit: MAX_PAGES_PER_USER });
    } catch (error) {
        console.error("Error fetching dynamic pages:", error);
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

        const count = await DynamicPage.countDocuments({ userId: session.user.id });
        if (count >= MAX_PAGES_PER_USER) {
            return NextResponse.json(
                { message: `You can only configure ${MAX_PAGES_PER_USER} pages. Delete one to create another.` },
                { status: 409 }
            );
        }

        const body = await req.json();
        if (!body?.name?.trim()) {
            return NextResponse.json({ message: "Page name is required" }, { status: 400 });
        }
        if (!body?.endpoint?.url?.trim()) {
            return NextResponse.json({ message: "API URL is required" }, { status: 400 });
        }

        const page = await DynamicPage.create({
            userId: session.user.id,
            name: body.name,
            description: body.description || '',
            endpoint: body.endpoint,
            rowsPath: body.rowsPath || '',
            layout: body.layout || 'table',
            columns: body.columns || [],
            card: body.card || { fieldKeys: [] },
            stats: body.stats || [],
            controls: body.controls || {},
        });

        return NextResponse.json({ page });
    } catch (error) {
        console.error("Error creating dynamic page:", error);
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
        const { id } = body;
        if (!id) {
            return NextResponse.json({ message: "Page ID is required" }, { status: 400 });
        }

        const page = await DynamicPage.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            {
                name: body.name,
                description: body.description || '',
                endpoint: body.endpoint,
                rowsPath: body.rowsPath || '',
                layout: body.layout || 'table',
                columns: body.columns || [],
                card: body.card || { fieldKeys: [] },
                stats: body.stats || [],
                controls: body.controls || {},
            },
            { new: true }
        );

        if (!page) {
            return NextResponse.json({ message: "Page not found" }, { status: 404 });
        }

        return NextResponse.json({ page });
    } catch (error) {
        console.error("Error updating dynamic page:", error);
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
            return NextResponse.json({ message: "Page ID is required" }, { status: 400 });
        }

        const page = await DynamicPage.findOneAndDelete({ _id: id, userId: session.user.id });
        if (!page) {
            return NextResponse.json({ message: "Page not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting dynamic page:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
