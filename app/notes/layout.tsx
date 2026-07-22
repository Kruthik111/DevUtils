import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Notes – Organized Developer Notes & Snippets",
    description:
        "Keep your developer notes, snippets, and links organized in groups and tabs with one-click copy.",
};

export default function NotesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
