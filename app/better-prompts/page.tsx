"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Copy,
    Check,
    PenTool,
    Code as CodeIcon,
    Image as ImageIcon,
    GraduationCap,
    MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type CategoryId = "writing" | "development" | "image" | "learn" | "socials";

interface Prompt {
    id: string;
    title: string;
    description: string;
    content: string;
}

interface Category {
    id: CategoryId;
    label: string;
    icon: React.ElementType;
    prompts: Prompt[];
}

const categories: Category[] = [
    {
        id: "writing",
        label: "Writing",
        icon: PenTool,
        prompts: [
            {
                id: "polish",
                title: "Polish & Refine",
                description: "Improves the grammar, flow, and readability of your text without changing its meaning.",
                content: "Please review the following text. Polish its grammar, improve its flow and readability, and correct any typos. Maintain the original meaning and tone:\n\n[INSERT TEXT HERE]"
            },
            {
                id: "formalize",
                title: "Formalize",
                description: "Transforms casual text into a professional and formal tone.",
                content: "Rewrite the following text to sound highly professional, formal, and suitable for a corporate or academic setting:\n\n[INSERT TEXT HERE]"
            },
            {
                id: "elaborate",
                title: "Elaborate & Expand",
                description: "Adds detail, examples, and depth to a short thought or text.",
                content: "Please expand on the following text. Add relevant details, provide illustrative examples, and deepen the explanation to make it more comprehensive:\n\n[INSERT TEXT HERE]"
            },
            {
                id: "brief",
                title: "Summarize & Condense",
                description: "Condenses a long text into a brief, easy-to-read summary.",
                content: "Condense the following text into a brief, clear, and concise summary. Highlight only the most important points and remove any fluff or redundancy:\n\n[INSERT TEXT HERE]"
            },
            {
                id: "explain",
                title: "Explain Complex Topic",
                description: "Explains something difficult in simple, easy-to-understand terms.",
                content: "Explain the concept of [INSERT TOPIC] in a clear, simple, and easy-to-understand manner. Use an analogy if helpful, and avoid overly technical jargon."
            }
        ]
    },
    {
        id: "development",
        label: "Development",
        icon: CodeIcon,
        prompts: [
            {
                id: "frontend",
                title: "Build Frontend UI Component",
                description: "Prompt for generating a React/Tailwind frontend component.",
                content: "Act as an expert Frontend Developer. Build a [INSERT COMPONENT NAME] using React and Tailwind CSS. Ensure the component is accessible, responsive, uses modern Hooks, and includes empty states if necessary. Write clean, modular, and well-commented code."
            },
            {
                id: "backend",
                title: "Design Backend API Endpoint",
                description: "Prompt for generating a robust backend logic or API endpoint.",
                content: "Act as an expert Backend Engineer. Design and implement a RESTful API endpoint for [INSERT FEATURE]. Use [INSERT FRAMEWORK/LANGUAGE]. Include input validation, proper error handling/status codes, and consider security best practices like rate limiting and sanitization."
            },
            {
                id: "system",
                title: "System Prompt (AI Code Editor)",
                description: "A comprehensive system prompt you can paste into AI code editors like Cursor or GitHub Copilot.",
                content: "You are an expert software engineer. Follow these rules always:\n1. Write clean, modular, to-the-point code without unnecessary explanations.\n2. Choose the most reliable and supported libraries.\n3. Check for edge cases, null states, and performance bottlenecks before offering a solution.\n4. When modifying existing code, ensure your changes harmonize with the established patterns.\n5. Prefix all new shell commands with `// turbo` if safe."
            }
        ]
    },
    {
        id: "image",
        label: "Image Generation",
        icon: ImageIcon,
        prompts: [
            {
                id: "photorealistic",
                title: "Photorealistic Portrait",
                description: "A highly detailed structured prompt for generating lifelike portraits.",
                content: "A photorealistic portrait of an [INSERT SUBJECT], shot on 35mm lens, f/1.8, cinematic lighting, dramatic shadows, highly detailed, 8k resolution, photorealistic, hyper-detailed, highly textured, sharp focus. --ar 16:9 --v 6.0"
            },
            {
                id: "illustration",
                title: "Stylized Illustration",
                description: "Prompt for generating vibrant, artistic illustrations.",
                content: "A vibrant stylized illustration of [INSERT SUBJECT] in the style of Studio Ghibli, digital drawing, rich pastel colors, soft whimsical lighting, magical atmosphere, highly detailed background, trending on ArtStation."
            },
            {
                id: "logo",
                title: "Minimalist Logo Design",
                description: "Prompt for generating clean logos and app icons.",
                content: "A minimalist vector logo design for a company named [INSERT NAME] representing [INSERT INDUSTRY/CONCEPT]. Flat design, clean lines, maximum 2 colors, white background, simple, elegant, modern."
            }
        ]
    },
    {
        id: "learn",
        label: "Learn",
        icon: GraduationCap,
        prompts: [
            {
                id: "eli5",
                title: "Explain Like I'm 5 (ELI5)",
                description: "Breaks down a complicated subject so a 5-year-old could understand it.",
                content: "Explain the concept of [INSERT TOPIC] as if I am 5 years old. Use highly relatable analogies, extremely simple language, and avoid any technical jargon."
            },
            {
                id: "socratic",
                title: "Socratic Tutor",
                description: "Acts as a tutor that guides you to the answer instead of just giving it.",
                content: "Act as a Socratic tutor. Do not give me direct answers to my questions. Instead, ask me thought-provoking questions that guide me to discover the answer myself. Let's start with my first topic: [INSERT TOPIC]"
            },
            {
                id: "analogy",
                title: "Teach by Analogy",
                description: "Creates memorable analogies for abstract concepts.",
                content: "I am trying to learn about [INSERT TOPIC]. Please provide 3 different real-world analogies that explain how this concept works. Break down how the components of the analogy map to the actual technical concepts."
            }
        ]
    },
    {
        id: "socials",
        label: "Socials",
        icon: MessageCircle,
        prompts: [
            {
                id: "linkedin",
                title: "LinkedIn Professional Post",
                description: "Formats a thought into an engaging LinkedIn post.",
                content: "Turn the following thought into an engaging LinkedIn post. It should start with a strong hook, use short easily scannable paragraphs, include 2-3 relevant hashtags at the bottom, and end with a question to encourage comments:\n\n[INSERT THOUGHT]"
            },
            {
                id: "twitter",
                title: "Twitter / X Thread Hook",
                description: "Generates viral hooks and outlines for a Twitter thread.",
                content: "I want to write a Twitter thread about [INSERT TOPIC]. Give me 5 different highly engaging opening hook tweets. Then, provide a bulleted outline of the points I should cover in the thread to maximize engagement and value."
            },
            {
                id: "instagram-caption",
                title: "Instagram Caption",
                description: "Crafts a catchy Instagram caption.",
                content: "Write a catchy Instagram caption for a photo showing [DESCRIBE PHOTO]. Include relevant emojis without overdoing it, and add 5-10 SEO-friendly hashtags."
            },
            {
                id: "instagram-bio",
                title: "Instagram Bio",
                description: "Generates snappy Instagram bio ideas.",
                content: "Give me 3 ideas for a snappy one-line Instagram bio related to a person who posts content about [INSERT TOPIC]. Keep it under 150 characters and use 1-2 relevant emojis."
            }
        ]
    }
];

export default function BetterPromptsPage() {
    const [activeCategory, setActiveCategory] = useState<CategoryId>("writing");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // promptInputs maps promptId -> (variableName -> value)
    const [promptInputs, setPromptInputs] = useState<Record<string, Record<string, string>>>({});

    // Helper to find unique [PLACEHOLDER] variables
    const getVariables = (content: string) => {
        const matches = Array.from(content.matchAll(/\[([A-Z0-9\s/]+)\]/g));
        const variables = matches.map(match => match[1]);
        return Array.from(new Set(variables));
    };

    const handleInputChange = (promptId: string, variable: string, value: string) => {
        setPromptInputs(prev => ({
            ...prev,
            [promptId]: {
                ...(prev[promptId] || {}),
                [variable]: value
            }
        }));
    };

    const getRenderedContent = (promptId: string, content: string) => {
        const inputs = promptInputs[promptId] || {};
        let renderedContent = content;

        // Replace all placeholders with their corresponding input value, or keep the placeholder if empty
        getVariables(content).forEach(variable => {
            const value = inputs[variable]?.trim();
            if (value) {
                renderedContent = renderedContent.replace(new RegExp(`\\[${variable}\\]`, 'g'), value);
            }
        });

        return renderedContent;
    };

    const handleCopy = async (id: string, text: string) => {
        try {
            if (!text.trim()) return;
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            toast.success("Prompt copied to clipboard!");

            setTimeout(() => {
                setCopiedId(null);
            }, 2000);
        } catch {
            toast.error("Failed to copy prompt.");
        }
    };

    const activeData = categories.find((c) => c.id === activeCategory);

    return (
        <div className="min-h-screen p-4 md:p-8 pb-32">
            <div className="max-w-6xl mx-auto mb-24">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl font-bold mb-2 text-foreground">
                        Better <span className="text-purple-600 dark:text-purple-400">Prompts</span>
                    </h1>
                    <p className="text-foreground/60 max-w-2xl mx-auto text-sm md:text-base">
                        A curated library of high-quality AI prompts. Simply copy, customize, and unlock optimal AI responses.
                    </p>
                </motion.div>

                {/* Tab System */}
                <div className="flex flex-col gap-6">
                    {/* Categories Horizontal Tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full"
                    >
                        <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-2 shadow-sm overflow-x-auto scrollbar-hide">
                            <nav className="flex flex-row gap-2 min-w-max">
                                {categories.map((category) => {
                                    const Icon = category.icon;
                                    const isActive = activeCategory === category.id;
                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => setActiveCategory(category.id)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap",
                                                isActive
                                                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20 shadow-sm"
                                                    : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground border border-transparent"
                                            )}
                                        >
                                            <Icon className={cn("w-5 h-5", isActive && "text-purple-500")} />
                                            {category.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </motion.div>

                    {/* Prompts Grid */}
                    <div className="w-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeCategory}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="grid gap-4 md:grid-cols-1 lg:grid-cols-2"
                            >
                                {activeData?.prompts.map((prompt) => {
                                    const variables = getVariables(prompt.content);

                                    return (
                                        <div
                                            key={prompt.id}
                                            className="group bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/5 flex flex-col h-full"
                                        >
                                            <div className="p-5 flex flex-col flex-1">
                                                <div className="flex justify-between items-start gap-4 mb-3">
                                                    <h3 className="text-lg font-semibold text-foreground leading-tight">
                                                        {prompt.title}
                                                    </h3>
                                                    <button
                                                        onClick={() => handleCopy(prompt.id, getRenderedContent(prompt.id, prompt.content))}
                                                        className={cn(
                                                            "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all",
                                                            copiedId === prompt.id
                                                                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                                                : "bg-foreground/5 text-foreground/50 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400"
                                                        )}
                                                        title="Copy prompt"
                                                    >
                                                        {copiedId === prompt.id ? (
                                                            <Check className="w-4 h-4" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                                <p className="text-sm text-foreground/60 mb-4 min-h-[40px] shrink-0">
                                                    {prompt.description}
                                                </p>

                                                {/* Dynamic Input Variables */}
                                                {variables.length > 0 && (
                                                    <div className="flex flex-col gap-2 border-t border-border/30 pt-4 mb-4">
                                                        {variables.map((variable) => (
                                                            <div key={variable} className="flex flex-col gap-1">
                                                                <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">{variable}</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder={`Enter ${variable.toLowerCase()}...`}
                                                                    value={promptInputs[prompt.id]?.[variable] || ""}
                                                                    onChange={(e) => handleInputChange(prompt.id, variable, e.target.value)}
                                                                    className="w-full px-3 py-2 text-sm bg-foreground/5 border border-border/50 rounded-lg focus:outline-none focus:border-purple-500/50 transition-colors"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Code Block Container */}
                                                <div className="mt-auto relative rounded-xl bg-foreground/5 p-4 border border-border/50 group-hover:bg-purple-500/5 transition-colors overflow-y-auto max-h-[160px] scrollbar-hide">
                                                    <p className="text-sm text-foreground/80 font-mono whitespace-pre-wrap leading-relaxed inline-block">
                                                        {getRenderedContent(prompt.id, prompt.content)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
