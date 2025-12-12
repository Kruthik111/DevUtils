import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import ApiConfig from "@/lib/models/ApiConfig";
import User from "@/lib/models/User";

// Check if user has access to API page
async function checkAccess(userId: string): Promise<boolean> {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return false;
    
    // Admin has access to everything
    if (user.role === 'admin') return true;
    
    // Check if user has access to /api page
    return user.hasAccess?.includes('/api') || false;
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

        // Get all API configs for the user, sorted by lastOpened
        const apiConfigs = await ApiConfig.find({ userId: session.user.id })
            .sort({ lastOpened: -1 });

        return NextResponse.json({ apiConfigs });
    } catch (error) {
        console.error("Error fetching API configs:", error);
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
        const { name, method, url, headers, queryParams, payload, environmentId } = body;

        const apiConfig = await ApiConfig.create({
            userId: session.user.id,
            name: name || 'Untitled API',
            method: method || 'GET',
            url,
            headers: headers || {},
            queryParams: queryParams || {},
            payload: payload || '',
            environmentId: environmentId || null,
            lastOpened: new Date(),
        });

        return NextResponse.json({ apiConfig });
    } catch (error) {
        console.error("Error creating API config:", error);
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

        // Check access
        const hasAccess = await checkAccess(session.user.id);
        if (!hasAccess) {
            return NextResponse.json({ message: "Access denied" }, { status: 403 });
        }

        const body = await req.json();
        const { id, name, method, url, headers, queryParams, payload, environmentId } = body;

        const apiConfig = await ApiConfig.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            {
                name,
                method,
                url,
                headers: headers || {},
                queryParams: queryParams || {},
                payload: payload || '',
                environmentId: environmentId || null,
                lastOpened: new Date(),
            },
            { new: true }
        );

        if (!apiConfig) {
            return NextResponse.json({ message: "API config not found" }, { status: 404 });
        }

        return NextResponse.json({ apiConfig });
    } catch (error) {
        console.error("Error updating API config:", error);
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
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: "API config ID is required" }, { status: 400 });
        }

        const apiConfig = await ApiConfig.findOneAndDelete({ _id: id, userId: session.user.id });

        if (!apiConfig) {
            return NextResponse.json({ message: "API config not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting API config:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

