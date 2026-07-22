import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "README Preview – Online Markdown Editor & Previewer",
    description:
        "Free online README and markdown previewer. Write GitHub-flavored markdown and see the rendered preview live, with tables, code blocks, and inline formatting.",
    keywords: [
        "README preview",
        "markdown editor",
        "markdown previewer",
        "GitHub readme",
        "markdown to HTML",
        "online markdown viewer",
    ],
    openGraph: {
        title: "README Preview – Online Markdown Editor & Previewer",
        description:
            "Write GitHub-flavored markdown and see the rendered preview live.",
        type: "website",
    },
};

export default function ReadmePreviewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
