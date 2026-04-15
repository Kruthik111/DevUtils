"use client";

import { useState, useRef } from "react";
import { Copy, Check, Trash2, Download, FileText, ChevronDown, Code2, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

type EditorTab = "markdown" | "rich" | "preview";

// Simple markdown to HTML converter
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Preserve multiple newlines as empty paragraphs
  // First, split by double newlines to get blocks
  const blocks = html.split(/\n{2,}/);

  html = blocks.map((block) => {
    // Code blocks with syntax highlighting
    if (block.includes("```")) {
      return block.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
    }

    // Process inline code first
    block = block.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Headers
    block = block.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
    block = block.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
    block = block.replace(/^# (.*?)$/gm, "<h1>$1</h1>");
    block = block.replace(/^#### (.*?)$/gm, "<h4>$1</h4>");
    block = block.replace(/^##### (.*?)$/gm, "<h5>$1</h5>");
    block = block.replace(/^###### (.*?)$/gm, "<h6>$1</h6>");

    // Bold
    block = block.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    block = block.replace(/__(.+?)__/g, "<strong>$1</strong>");

    // Italic
    block = block.replace(/\*(.*?)\*/g, "<em>$1</em>");
    block = block.replace(/_(.+?)_/g, "<em>$1</em>");

    // Links
    block = block.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

    // Images
    block = block.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />');

    // Unordered lists
    if (block.match(/^\s*[-*]\s/m)) {
      const listItems = block.split("\n").map(line => {
        if (line.match(/^\s*[-*]\s/)) {
          return `<li>${line.replace(/^\s*[-*]\s/, "")}</li>`;
        }
        return line;
      }).join("\n");
      return `<ul>${listItems}</ul>`;
    }

    // Ordered lists
    if (block.match(/^\s*\d+\.\s/m)) {
      const listItems = block.split("\n").map(line => {
        if (line.match(/^\s*\d+\.\s/)) {
          return `<li>${line.replace(/^\s*\d+\.\s/, "")}</li>`;
        }
        return line;
      }).join("\n");
      return `<ol>${listItems}</ol>`;
    }

    // Blockquotes
    if (block.match(/^>\s/m)) {
      return `<blockquote>${block.replace(/^>\s/gm, "")}</blockquote>`;
    }

    // Horizontal rules
    if (block.match(/^(---|___|\*\*\*)$/)) {
      return "<hr />";
    }

    // Paragraphs - preserve line breaks within paragraphs
    if (
      block.match(/^<[h|u|o|b|p|c|l|pre]/) ||
      block.match(/^<\//)
    ) {
      return block;
    }

    return `<p>${block.replace(/\n/g, "<br />")}</p>`;
  }).join("\n\n");

  return html;
}

type DownloadFormat = "html" | "pdf";

export default function ReadmePreviewPage() {
  const [markdownContent, setMarkdownContent] = useState(
    "# Welcome to README Preview\n\n" +
    "Paste your README markdown content on the left to see a live preview on the right.\n\n" +
    "## Features\n" +
    "- **Live Preview** - See your markdown rendered in real-time\n" +
    "- **Copy Preview Content** - Copy rendered text for Google Docs and other platforms\n" +
    "- **Clear Content** - Reset and start fresh\n" +
    "- **Download Preview** - Export as HTML or PDF\n\n" +
    "## Supported Markdown\n" +
    "All standard markdown syntax is supported including:\n" +
    "- Headers (h1-h6)\n" +
    "- Lists (ordered and unordered)\n" +
    "- **Bold**, *italic*, and `code`\n" +
    "- Links and images\n" +
    "- Code blocks\n" +
    "- Blockquotes and horizontal rules"
  );

  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>("markdown");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const richEditorRef = useRef<HTMLDivElement>(null);

  const handleCopyContent = async () => {
    if (!previewRef.current) return;

    try {
      // Select all content in the preview
      const selection = window.getSelection();
      if (!selection) return;

      const range = document.createRange();
      range.selectNodeContents(previewRef.current);
      selection.removeAllRanges();
      selection.addRange(range);

      // Copy the selected content (preserves formatting)
      const successful = document.execCommand("copy");

      if (successful) {
        setCopiedSection("content");
        toast.success("Preview content copied to clipboard");
        setTimeout(() => setCopiedSection(null), 2000);
      } else {
        toast.error("Failed to copy content");
      }

      // Deselect
      selection.removeAllRanges();
    } catch (error) {
      toast.error("Failed to copy content");
    }
  };

  const applyRichTextFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    richEditorRef.current?.focus();
  };

  const syncRichEditorToMarkdown = () => {
    if (!richEditorRef.current) return;

    const html = richEditorRef.current.innerHTML;

    // Simple HTML to Markdown conversion
    let markdown = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, (match, content) => `# ${content.replace(/<[^>]*>/g, '')}\n`)
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, (match, content) => `## ${content.replace(/<[^>]*>/g, '')}\n`)
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, (match, content) => `### ${content.replace(/<[^>]*>/g, '')}\n`)
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, (match, content) => `#### ${content.replace(/<[^>]*>/g, '')}\n`)
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, (match, content) => `##### ${content.replace(/<[^>]*>/g, '')}\n`)
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, (match, content) => `###### ${content.replace(/<[^>]*>/g, '')}\n`)
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, (match, content) => `**${content.replace(/<[^>]*>/g, '')}**`)
      .replace(/<b[^>]*>(.*?)<\/b>/gi, (match, content) => `**${content.replace(/<[^>]*>/g, '')}**`)
      .replace(/<em[^>]*>(.*?)<\/em>/gi, (match, content) => `*${content.replace(/<[^>]*>/g, '')}*`)
      .replace(/<i[^>]*>(.*?)<\/i>/gi, (match, content) => `*${content.replace(/<[^>]*>/g, '')}*`)
      .replace(/<code[^>]*>(.*?)<\/code>/gi, (match, content) => `\`${content.replace(/<[^>]*>/g, '')}\``)
      .replace(/<pre[^>]*>(.*?)<\/pre>/gi, (match, content) => `\`\`\`\n${content.replace(/<[^>]*>/g, '')}\n\`\`\``)
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, (match, url, text) => `[${text.replace(/<[^>]*>/g, '')}](${url})`)
      .replace(/<li[^>]*>(.*?)<\/li>/gi, (match, content) => `- ${content.replace(/<[^>]*>/g, '')}`)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, (match, content) => `> ${content.replace(/<[^>]*>/g, '')}`)
      .replace(/<p[^>]*>(.*?)<\/p>/gi, (match, content) => `${content.replace(/<[^>]*>/g, '')}\n`)
      .replace(/<ul[^>]*>(.*?)<\/ul>/gi, (match, content) => `${content}`)
      .replace(/<ol[^>]*>(.*?)<\/ol>/gi, (match, content) => `${content}`)
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();

    setMarkdownContent(markdown);
    setActiveTab("markdown");
    toast.success("Converted to Markdown");
  };

  const handleClear = () => {
    setMarkdownContent("");
    toast.success("Content cleared");
  };

  const downloadAsHtml = () => {
    if (!previewRef.current) return;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>README Preview</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }

    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }

    h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h3 { font-size: 1.25em; }
    h4 { font-size: 1em; }
    h5 { font-size: 0.875em; }
    h6 { font-size: 0.85em; color: #6a737d; }

    p { margin-bottom: 16px; }

    code {
      background-color: #f6f8fa;
      border-radius: 3px;
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
      color: #24292e;
    }

    pre {
      background-color: #f6f8fa;
      border-radius: 6px;
      padding: 16px;
      overflow: auto;
      margin-bottom: 16px;
      font-size: 85%;
    }

    pre code {
      background-color: transparent;
      padding: 0;
      margin: 0;
      font-size: 100%;
      color: inherit;
    }

    ul, ol {
      padding-left: 2em;
      margin-bottom: 16px;
    }

    li { margin-bottom: 8px; }

    blockquote {
      border-left: 4px solid #dfe2e5;
      padding: 0 1em;
      color: #6a737d;
      margin: 0 0 16px 0;
    }

    a {
      color: #0366d6;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    img {
      max-width: 100%;
      height: auto;
      margin: 16px 0;
    }

    hr {
      height: 0.25em;
      padding: 0;
      margin: 24px 0;
      background-color: #e1e4e8;
      border: 0;
    }
  </style>
</head>
<body>
  ${previewRef.current.innerHTML}
</body>
</html>
    `.trim();

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "readme-preview.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Downloaded as HTML");
    setDownloadMenuOpen(false);
  };

  const downloadAsPdf = async () => {
    if (!previewRef.current) return;

    try {
      const imgData = await toPng(previewRef.current, {
        cacheBust: true,
        backgroundColor: previewTheme === "dark" ? "#1a1a1a" : "#ffffff",
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Get image dimensions
      const img = new Image();
      img.src = imgData;

      const imgWidth = 210;
      const imgHeight = (img.height * imgWidth) / img.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save("readme-preview.pdf");
      toast.success("Downloaded as PDF");
      setDownloadMenuOpen(false);
    } catch (error) {
      toast.error("Failed to generate PDF");
    }
  };

  const htmlContent = markdownToHtml(markdownContent);

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">README Preview</h1>
            <p className="text-foreground/60 text-xs md:text-sm">Paste your markdown content and see it rendered in real-time</p>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 flex flex-col min-h-0 px-4 md:px-8 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Left Panel - Input with Tabs */}
          <div className="flex flex-col min-h-0">
            {/* Tab Headers */}
            <div className="flex gap-2 mb-4 border-b border-border">
              <button
                onClick={() => setActiveTab("markdown")}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2",
                  activeTab === "markdown"
                    ? "border-primary text-primary"
                    : "border-transparent text-foreground/60 hover:text-foreground"
                )}
              >
                <Code2 className="w-4 h-4 inline mr-2" />
                Markdown
              </button>
              <button
                onClick={() => setActiveTab("rich")}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2",
                  activeTab === "rich"
                    ? "border-primary text-primary"
                    : "border-transparent text-foreground/60 hover:text-foreground"
                )}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Rich Editor
              </button>
            </div>

            {/* Markdown Tab */}
            {activeTab === "markdown" && (
              <div className="flex flex-col min-h-0 gap-3 flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">Markdown Input</h2>
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-2 text-xs text-foreground/60 hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary px-2 py-1 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  value={markdownContent}
                  onChange={(e) => setMarkdownContent(e.target.value)}
                  placeholder="Paste your README markdown content here..."
                  className={cn(
                    "flex-1 w-full p-3 rounded-lg border border-border bg-secondary/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                    "font-mono text-xs resize-none min-h-0",
                    "placeholder:text-foreground/40",
                    "text-foreground overflow-y-auto min-h-screen"
                  )}
                />

                <div className="text-xs text-foreground/50">
                  {markdownContent.length} characters
                </div>
              </div>
            )}

            {/* Rich Editor Tab */}
            {activeTab === "rich" && (
              <div className="flex flex-col min-h-0 gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">Rich Text Editor</h2>
                  <button
                    onClick={syncRichEditorToMarkdown}
                    className="flex items-center gap-2 text-xs transition-colors bg-primary/20 hover:bg-primary/30 px-2 py-1 rounded text-primary hover:text-primary"
                  >
                    Convert to Markdown
                  </button>
                </div>

                {/* Rich Text Toolbar */}
                <div className="flex flex-wrap gap-1 p-2 bg-secondary/50 rounded-lg border border-border">
                  <ToolbarButton
                    title="Bold"
                    onClick={() => applyRichTextFormat("bold")}
                  >
                    <strong>B</strong>
                  </ToolbarButton>
                  <ToolbarButton
                    title="Italic"
                    onClick={() => applyRichTextFormat("italic")}
                  >
                    <em>I</em>
                  </ToolbarButton>
                  <ToolbarButton
                    title="Underline"
                    onClick={() => applyRichTextFormat("underline")}
                  >
                    <u>U</u>
                  </ToolbarButton>
                  <div className="w-px bg-border/50" />
                  <ToolbarButton
                    title="Heading 1"
                    onClick={() => applyRichTextFormat("formatBlock", "<h1>")}
                  >
                    H1
                  </ToolbarButton>
                  <ToolbarButton
                    title="Heading 2"
                    onClick={() => applyRichTextFormat("formatBlock", "<h2>")}
                  >
                    H2
                  </ToolbarButton>
                  <ToolbarButton
                    title="Heading 3"
                    onClick={() => applyRichTextFormat("formatBlock", "<h3>")}
                  >
                    H3
                  </ToolbarButton>
                  <div className="w-px bg-border/50" />
                  <ToolbarButton
                    title="Bullet List"
                    onClick={() => applyRichTextFormat("insertUnorderedList")}
                  >
                    • List
                  </ToolbarButton>
                  <ToolbarButton
                    title="Numbered List"
                    onClick={() => applyRichTextFormat("insertOrderedList")}
                  >
                    1. List
                  </ToolbarButton>
                  <ToolbarButton
                    title="Code"
                    onClick={() => applyRichTextFormat("formatBlock", "<pre>")}
                  >
                    &lt;/&gt;
                  </ToolbarButton>
                  <div className="w-px bg-border/50" />
                  <ToolbarButton
                    title="Clear Formatting"
                    onClick={() => applyRichTextFormat("removeFormat")}
                  >
                    Clear
                  </ToolbarButton>
                </div>

                {/* Rich Text Editor */}
                <div
                  ref={richEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={() => {}}
                  className={cn(
                    "flex-1 w-full p-3 rounded-lg border border-border bg-secondary/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                    "text-sm resize-none min-h-0 overflow-y-auto",
                    "text-foreground",
                    "prose prose-sm max-w-none"
                  )}
                  style={{
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {markdownContent}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Live Preview</h2>
              <div className="flex items-center gap-2">
                <select
                  value={previewTheme}
                  onChange={(e) => setPreviewTheme(e.target.value as "light" | "dark")}
                  className={cn(
                    "text-sm px-3 py-2 rounded-lg border border-border bg-secondary/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary",
                    "text-foreground cursor-pointer"
                  )}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>

                <button
                  onClick={handleCopyContent}
                  className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary px-3 py-2 rounded-lg"
                >
                  {copiedSection === "content" ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                    className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary px-3 py-2 rounded-lg"
                  >
                    <Download className="w-4 h-4" />
                    Download
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {downloadMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-50 min-w-[150px]">
                      <button
                        onClick={downloadAsHtml}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-secondary/50 transition-colors border-b border-border/50"
                      >
                        Download HTML
                      </button>
                      <button
                        onClick={downloadAsPdf}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-secondary/50 transition-colors"
                      >
                        Download PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <style>{`
              .readme-preview h1, .readme-preview h2, .readme-preview h3,
              .readme-preview h4, .readme-preview h5, .readme-preview h6 {
                margin-top: 20px;
                margin-bottom: 12px;
                font-weight: 600;
              }

              .readme-preview h1 {
                font-size: 1.75em;
                border-bottom: 1px solid currentColor;
                opacity: 0.8;
                padding-bottom: 8px;
              }

              .readme-preview h2 {
                font-size: 1.5em;
                border-bottom: 1px solid currentColor;
                opacity: 0.8;
                padding-bottom: 8px;
              }

              .readme-preview h3 { font-size: 1.25em; }
              .readme-preview h4 { font-size: 1.1em; }
              .readme-preview h5 { font-size: 1em; }
              .readme-preview h6 { font-size: 0.9em; opacity: 0.8; }

              .readme-preview p {
                margin-bottom: 12px;
              }

              .readme-preview code {
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
              }

              .readme-preview.light code {
                background-color: #f0f0f0;
                color: #d4423f;
              }

              .readme-preview.dark code {
                background-color: #2d2d2d;
                color: #ff7675;
              }

              .readme-preview pre {
                padding: 12px;
                border-radius: 6px;
                overflow-x: auto;
                margin: 12px 0;
                font-size: 0.85em;
              }

              .readme-preview.light pre {
                background-color: #f0f0f0;
              }

              .readme-preview.dark pre {
                background-color: #2d2d2d;
              }

              .readme-preview pre code {
                padding: 0;
                border-radius: 0;
                background-color: transparent;
              }

              .readme-preview ul, .readme-preview ol {
                padding-left: 24px;
                margin-bottom: 12px;
              }

              .readme-preview li {
                margin-bottom: 6px;
              }

              .readme-preview blockquote {
                border-left: 4px solid currentColor;
                padding-left: 12px;
                margin: 12px 0;
                opacity: 0.8;
              }

              .readme-preview a {
                text-decoration: none;
                font-weight: 500;
              }

              .readme-preview.light a {
                color: #0366d6;
              }

              .readme-preview.dark a {
                color: #58a6ff;
              }

              .readme-preview a:hover {
                text-decoration: underline;
              }

              .readme-preview img {
                max-width: 100%;
                height: auto;
                margin: 12px 0;
                border-radius: 4px;
              }

              .readme-preview hr {
                border: none;
                height: 2px;
                margin: 20px 0;
                opacity: 0.3;
              }
            `}</style>

            <div
              ref={previewRef}
              className={cn(
                "flex-1 w-full p-6 rounded-xl border border-border overflow-y-auto min-h-0",
                previewTheme === "dark"
                  ? "bg-[#1a1a1a] text-[#e4e4e7] readme-preview dark"
                  : "bg-white text-[#1f2937] readme-preview light"
              )}
              dangerouslySetInnerHTML={{ __html: htmlContent as string }}
            />
          </div>
        </div>
      </div>

    </div>
  );
}

function ToolbarButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded text-xs font-medium transition-colors",
        "bg-secondary hover:bg-accent text-foreground/70 hover:text-foreground",
        "border border-border/50 hover:border-border"
      )}
    >
      {children}
    </button>
  );
}
