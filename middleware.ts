import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isOnDashboard = req.nextUrl.pathname.startsWith("/notes");
    const isOnAuth = req.nextUrl.pathname.startsWith("/signin") || req.nextUrl.pathname.startsWith("/register");

    if (isOnDashboard) {
        if (isLoggedIn) return NextResponse.next();
        return NextResponse.redirect(new URL("/signin", req.nextUrl));
    }

    if (isOnAuth) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL("/notes", req.nextUrl));
        }
        return NextResponse.next();
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
