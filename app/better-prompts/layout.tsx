import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Better Prompts | AI Prompt Library",
    description: "A curated collection of the best AI prompts for writing, development, image generation, learning, and social media. Copy and paste instantly.",
    keywords: ["AI prompts", "ChatGPT prompts", "Cursor AI prompts", "Midjourney prompts", "writing prompts", "developer prompts", "prompt engineering"],
    openGraph: {
        title: "Better Prompts | AI Prompt Library",
        description: "Curated collection of high-quality AI prompts to supercharge your workflow.",
        type: "website",
    },
};

export default function BetterPromptsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
