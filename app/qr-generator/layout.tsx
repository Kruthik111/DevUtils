import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "QR Code Generator – Free Online QR Maker",
    description:
        "Generate QR codes online for free. Create QR codes for URLs, text, Wi-Fi, and more, then download them instantly. No sign-up required.",
    keywords: [
        "QR code generator",
        "free QR code",
        "QR maker",
        "generate QR code online",
        "URL to QR code",
        "download QR code",
    ],
    openGraph: {
        title: "QR Code Generator – Free Online QR Maker",
        description:
            "Create and download QR codes for URLs, text, and more. Free, no sign-up.",
        type: "website",
    },
};

export default function QrGeneratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
