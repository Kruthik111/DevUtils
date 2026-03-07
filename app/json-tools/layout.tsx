import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "JSON Formatter & Decoder Tool | DevUtils",
    description: "Free online JSON formatter, validator, parser, and decoder tool. Prettify, minify, and search your JSON payloads instantly.",
    keywords: ["JSON formatter", "JSON decode", "JSON validator", "Prettify JSON", "JSON parser", "JSON to URL encoding"],
    openGraph: {
        title: "JSON Formatter & Decoder Tool",
        description: "Free online JSON formatter, validator, and decoder. Make your JSON payloads readable instantly.",
        type: "website",
    },
};

export default function JsonToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
