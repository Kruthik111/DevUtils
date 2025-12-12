import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import ApiConfig from "@/lib/models/ApiConfig";
import User from "@/lib/models/User";

async function checkAccess(userId: string): Promise<boolean> {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.hasAccess?.includes('/api') || false;
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
        const { method, url, headers, queryParams, payload, apiConfigId } = body;

        // Update lastOpened if apiConfigId is provided
        if (apiConfigId) {
            await ApiConfig.findOneAndUpdate(
                { _id: apiConfigId, userId: session.user.id },
                { lastOpened: new Date() }
            );
        }

        // Build URL with query params
        let requestUrl = url;
        if (queryParams && Object.keys(queryParams).length > 0) {
            const urlObj = new URL(url);
            Object.entries(queryParams).forEach(([key, value]) => {
                if (value) {
                    urlObj.searchParams.append(key, value as string);
                }
            });
            requestUrl = urlObj.toString();
        }

        // Parse headers
        const requestHeaders: Record<string, string> = {};
        if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
                if (key && value) {
                    requestHeaders[key] = value as string;
                }
            });
        }

        // Make the API request
        const requestOptions: RequestInit = {
            method: method || 'GET',
            headers: requestHeaders,
        };

        if (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            try {
                // Try to parse as JSON, if it fails, send as string
                const parsedPayload = JSON.parse(payload);
                requestOptions.body = JSON.stringify(parsedPayload);
                requestHeaders['Content-Type'] = 'application/json';
            } catch {
                requestOptions.body = payload;
            }
        }

        const response = await fetch(requestUrl, requestOptions);
        const responseText = await response.text();
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch {
            responseData = responseText;
        }

        // Get response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        return NextResponse.json({
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            data: responseData,
            ok: response.ok,
        });
    } catch (error: any) {
        console.error("Error making API request:", error);
        return NextResponse.json({
            error: error.message || "Failed to make API request",
            status: 500,
        }, { status: 500 });
    }
}

