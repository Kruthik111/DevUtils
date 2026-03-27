"use client";

import { useState, useRef } from "react";
import { QrCode, Download, Image as ImageIcon, FileText, Code, Palette, Type, Square, Layout, Check, ExternalLink } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { cn } from "@/lib/utils";

export default function QRGeneratorPage() {
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState<"content" | "design">("content");
  const [title, setTitle] = useState("");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [containerBg, setContainerBg] = useState("#ffffff");
  const [borderColor, setBorderColor] = useState("#fb712a");
  const [borderWidth, setBorderWidth] = useState(2);
  const [borderStyle, setBorderStyle] = useState("solid");
  const [showText, setShowText] = useState(true);
  const [size, setSize] = useState(256);
  const [sheetType, setSheetType] = useState<"a4" | "square" | "minimal">("square");
  
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = async (type: "png" | "pdf" | "html") => {
    if (!text) {
      toast.error("Please enter some text or URL first");
      return;
    }

    if (!qrRef.current) return;

    try {
      if (type === "png" || type === "pdf") {
        const dataUrl = await toPng(qrRef.current, { quality: 1, pixelRatio: 2 });

        if (type === "png") {
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = `qr-code-${Date.now()}.png`;
          link.click();
          toast.success("Downloaded as PNG");
        } else if (type === "pdf") {
          const pdf = new jsPDF("p", "mm", "a4");
          const imgProps = pdf.getImageProperties(dataUrl);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save(`qr-code-${Date.now()}.pdf`);
          toast.success("Downloaded as PDF");
        }
      } else if (type === "html") {
        // For HTML, we'll still use the simple image embed for convenience
        const dataUrl = await toPng(qrRef.current, { quality: 1, pixelRatio: 2 });
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DevUtils QR Code</title>
    <style>
        body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f0f0f0; }
        .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; }
        img { max-width: 100%; border-radius: 8px; }
        .footer { margin-top: 15px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="card">
        <img src="${dataUrl}" alt="QR Code" />
        <div class="footer">Generated with <a href="https://devutils.ai" style="color: #fb712a; text-decoration: none; font-weight: bold;">DevUtils</a></div>
    </div>
</body>
</html>`;
        const blob = new Blob([htmlContent], { type: "text/html" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `qr-code-${Date.now()}.html`;
        link.click();
        toast.success("Downloaded as HTML");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate download");
    }
  };

  const borderStyles = ["solid", "dashed", "dotted", "double", "none"];

  return (
    <div className="min-h-screen bg-background text-foreground py-6 md:py-8 font-sans w-full">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <QrCode className="w-8 h-8 text-primary" />
            Advanced QR Generator
          </h1>
          <p className="text-foreground/50 text-sm">Professional QR codes with custom branding, borders, and high-res exports.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls - 7 columns */}
          <div className="lg:col-span-7 space-y-6 order-2 lg:order-none">
            
            {/* Mobile Tab Switcher */}
            <div className="lg:hidden flex gap-0 border border-border rounded-xl overflow-hidden mb-2">
              <button
                onClick={() => setActiveTab("content")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all ${
                  activeTab === "content"
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "bg-background text-foreground/40 hover:text-foreground/60"
                }`}
              >
                <Type className="w-4 h-4" />
                Content
              </button>
              <button
                onClick={() => setActiveTab("design")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all ${
                  activeTab === "design"
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "bg-background text-foreground/40 hover:text-foreground/60"
                }`}
              >
                <Palette className="w-4 h-4" />
                Design
              </button>
            </div>

            {/* Input Section - Content Tab on mobile, always visible on desktop */}
            <div className={`bg-background border border-border rounded-xl p-5 shadow-sm ${activeTab !== "content" ? "hidden lg:block" : ""}`}>
              <div className="flex items-center gap-2 text-sm font-bold text-foreground/90 mb-4 uppercase tracking-wider">
                <Type className="w-4 h-4 text-primary" />
                Content & Branding
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-foreground/40 mb-1.5 block">QR TEXT OR URL</label>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-1 focus:ring-primary/50 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground/40 mb-1.5 block">CUSTOM TITLE (APPEARS ON TOP)</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Scanning this joins the team..."
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-1 focus:ring-primary/50 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Styling Section - Design Tab on mobile, always visible on desktop */}
            <div className={`bg-background border border-border rounded-xl p-5 shadow-sm ${activeTab !== "design" ? "hidden lg:block" : ""}`}>
              <div className="flex items-center gap-2 text-sm font-bold text-foreground/90 mb-6 uppercase tracking-wider">
                <Palette className="w-4 h-4 text-primary" />
                Theme & Colors
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ColorPicker label="QR FOREGROUND" value={fgColor} onChange={setFgColor} />
                <ColorPicker label="QR BACKGROUND" value={bgColor} onChange={setBgColor} />
                <ColorPicker label="CONTAINER BG" value={containerBg} onChange={setContainerBg} />
                <ColorPicker label="BORDER COLOR" value={borderColor} onChange={setBorderColor} />
              </div>
            </div>

            {/* Border & Options Section - Design Tab on mobile, always visible on desktop */}
            <div className={`bg-background border border-border rounded-xl p-5 shadow-sm ${activeTab !== "design" ? "hidden lg:block" : ""}`}>
              <div className="flex items-center gap-2 text-sm font-bold text-foreground/90 mb-6 uppercase tracking-wider">
                <Square className="w-4 h-4 text-primary" />
                Border & Layout
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs text-foreground/40 mb-3 block">SHEET TYPE</label>
                    <div className="flex flex-wrap gap-2">
                      {(["square", "a4", "minimal"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setSheetType(t)}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${sheetType === t ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary text-foreground/40 hover:text-foreground hover:bg-accent"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-foreground/40 mb-3 block">BORDER WIDTH: {borderWidth}px</label>
                    <input 
                      type="range" min="0" max="20" step="1"
                      value={borderWidth} onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-foreground/40 mb-3 block">BORDER STYLE</label>
                    <div className="flex flex-wrap gap-2">
                      {borderStyles.map((s) => (
                        <button
                          key={s}
                          onClick={() => setBorderStyle(s)}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${borderStyle === s ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary text-foreground/40 hover:text-foreground hover:bg-accent"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <OptionToggle 
                    label="Show Text/Link at bottom" 
                    active={showText} 
                    onToggle={() => setShowText(!showText)} 
                  />
                  <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <ExternalLink className="w-4 h-4 text-primary" />
                    <span className="text-xs text-foreground/60">Includes "Created with DevUtils" watermark link at bottom right.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview & Download - 5 columns */}
          <div className="lg:col-span-5 space-y-6 order-1 lg:order-none">
            <div className="bg-background border border-border rounded-xl p-6 flex flex-col items-center shadow-xl">
              <div className="w-full flex justify-between items-center mb-6">
                <div className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">LIVE PREVIEW</div>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-primary/40"></div>
                </div>
              </div>

              {/* The Wrapper that provides external padding (prevents border touching edge) */}
              <div 
                ref={qrRef}
                className="w-full flex justify-center p-8 transition-all"
                style={{ backgroundColor: containerBg }}
              >
                {/* The Styled Core Container */}
                <div 
                  className={cn(
                    "relative flex flex-col items-center p-8 transition-all overflow-hidden",
                    sheetType === "a4" ? "aspect-[1/1.414]" : sheetType === "square" ? "aspect-square" : "h-auto"
                  )}
                  style={{ 
                    backgroundColor: containerBg,
                    border: `${borderWidth}px ${borderStyle} ${borderColor}`,
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: sheetType === "minimal" ? 'fit-content' : '400px'
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full w-full">
                    {title && (
                      <div className="text-center font-bold mb-6 wrap-break-word w-full px-2" style={{ color: fgColor }}>
                        {title}
                      </div>
                    )}

                    <div className="p-4 rounded-lg shadow-sm shrink-0" style={{ backgroundColor: bgColor }}>
                      <QRCodeCanvas 
                        value={text || "https://devutils.ai"} 
                        size={size} 
                        fgColor={fgColor} 
                        bgColor={bgColor}
                        level="H"
                      />
                    </div>

                    {showText && text && (
                      <div className="mt-6 text-[10px] font-medium break-all text-center opacity-60 w-full px-4" style={{ color: fgColor }}>
                        {text}
                      </div>
                    )}
                  </div>

                  {/* Watermark */}
                  <div className="absolute bottom-2 right-3 flex items-center gap-1 opacity-40 pointer-events-none">
                    <span className="text-[8px] font-bold" style={{ color: fgColor }}>Created with</span>
                    <span className="text-[8px] font-black" style={{ color: borderColor }}>DevUtils</span>
                  </div>
                </div>
              </div>

              {/* Download buttons - visible on desktop inside preview panel */}
              <div className="w-full mt-8 grid-cols-1 gap-3 hidden lg:grid">
                <button 
                  onClick={() => handleDownload("png")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  <ImageIcon className="w-4 h-4" /> DOWNLOAD PNG IMAGE
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleDownload("pdf")}
                    className="bg-secondary border border-border hover:bg-accent text-foreground/80 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <FileText className="w-4 h-4 text-primary" /> PDF DOC
                  </button>
                  <button 
                    onClick={() => handleDownload("html")}
                    className="bg-secondary border border-border hover:bg-accent text-foreground/80 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Code className="w-4 h-4 text-primary" /> HTML CODE
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Download buttons - visible on mobile below tabs, order-3 */}
          <div className="w-full grid grid-cols-1 gap-3 order-3 lg:hidden">
            <button 
              onClick={() => handleDownload("png")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <ImageIcon className="w-4 h-4" /> DOWNLOAD PNG IMAGE
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleDownload("pdf")}
                className="bg-secondary border border-border hover:bg-accent text-foreground/80 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <FileText className="w-4 h-4 text-primary" /> PDF DOC
              </button>
              <button 
                onClick={() => handleDownload("html")}
                className="bg-secondary border border-border hover:bg-accent text-foreground/80 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Code className="w-4 h-4 text-primary" /> HTML CODE
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-foreground/40 mb-2 block tracking-widest uppercase">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 shrink-0 border border-foreground/10 rounded-lg overflow-hidden cursor-pointer group">
          <input 
            type="color" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer"
          />
        </div>
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground/60 focus:text-foreground outline-none"
        />
      </div>
    </div>
  );
}

function OptionToggle({ label, active, onToggle }: { label: string, active: boolean, onToggle: () => void }) {
  return (
    <button 
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${active ? "bg-primary/10 border-primary/30" : "bg-secondary border-border hover:bg-accent"}`}
    >
      <span className={`text-xs font-bold ${active ? "text-foreground" : "text-foreground/40"}`}>{label}</span>
      <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${active ? "bg-primary text-primary-foreground" : "bg-background border border-foreground/5"}`}>
        {active && <Check className="w-3.5 h-3.5" />}
      </div>
    </button>
  );
}
