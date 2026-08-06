"use client";

import { useState } from "react";
import { 
  Search, 
  Settings, 
  HelpCircle, 
  Plus,
  Link as LinkIcon,
  User,
  Code,
  LayoutGrid,
  Key,
  Lock,
  Eye,

  Braces,
  QrCode,
  History,
  Copy,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8 font-sans w-full selection:bg-primary/30">

      {/* Header Info */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notes & Links</h1>
        <p className="text-foreground/50 text-sm">Manage your external references and secure credentials.</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Wider) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Developer Bookmarks */}
          <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground/90">
                <LinkIcon className="w-4 h-4 text-primary" />
                DEVELOPER BOOKMARKS
              </div>
              <button className="text-primary text-xs font-semibold hover:text-primary/80 transition-colors">
                Edit List
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <BookmarkItem 
                icon={<User className="w-4 h-4 text-primary" />}
                title="LinkedIn Profile"
                url="linkedin.com/in/devuser-ai"
              />
              <div className="h-px w-full bg-border/50 my-1" />
              <BookmarkItem 
                icon={<Code className="w-4 h-4 text-foreground/70" />}
                title="GitHub Repository"
                url="github.com/devutils/main-engine"
              />
              <div className="h-px w-full bg-border/50 my-1" />
              <BookmarkItem 
                icon={<LayoutGrid className="w-4 h-4 text-primary" />}
                title="Personal SaaS App"
                url="console.myapp.io/dashboard"
              />
            </div>
          </div>

          {/* Login Credentials */}
          <div className="bg-background border border-border rounded-xl p-5 shadow-sm mt-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground/90">
                <Key className="w-4 h-4 text-primary" />
                LOGIN CREDENTIALS
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-1 rounded-md">
                <Lock className="w-3 h-3" />
                AES-256 ENCRYPTED
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CredentialItem title="STAGING DB ROOT" />
              <CredentialItem title="AWS ACCESS KEY" />
            </div>
          </div>
          
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          
          {/* Quick Tools */}
          <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
            <div className="text-sm font-bold text-foreground/90 mb-6">
              QUICK TOOLS
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <ToolCard icon={<Braces className="w-5 h-5 text-primary" />} label="JSON FORMAT" href="/json-tools" />
              <ToolCard icon={<QrCode className="w-5 h-5 text-primary" />} label="QR GENERATOR" href="/qr-generator" />
              <ToolCard icon={<History className="w-5 h-5 text-primary" />} label="EPOCH CONV" href="/epoch-converter" />
            </div>
          </div>

          {/* Total Usage */}
          <div className="bg-linear-to-br from-[#fd7a33] to-[#eb5a0c] rounded-xl p-6 shadow-lg relative overflow-hidden group">
            {/* Background design element */}
            <div className="absolute -right-6 -bottom-6 opacity-20 pointer-events-none transform group-hover:scale-110 transition-transform duration-500">
              <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            
            <div className="relative z-10">
              <div className="text-xs font-bold text-white/80 tracking-wider mb-2">TOTAL USAGE</div>
              <div className="text-4xl font-black text-white mb-1">12,482</div>
              <div className="text-sm text-white/90 mb-6 font-medium">API Calls this month</div>
              
              <div className="w-full bg-black/20 rounded-full h-1.5 mb-2">
                <div className="bg-white h-1.5 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <div className="text-[10px] font-bold text-white/80 tracking-wider">
                65% OF PRO LIMIT
              </div>
            </div>
          </div>

          {/* Last Snippet */}
          <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-foreground/90">LAST SNIPPET</div>
              <div className="text-[10px] text-foreground/60">2h ago</div>
            </div>
            
            <div className="bg-background/50 border border-border/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <span className="text-blue-600">const</span> <span className="text-foreground">config</span> <span className="text-blue-600">=</span> <span className="text-yellow-300">{`{`}</span><br/>
              &nbsp;&nbsp;<span className="text-orange-300">apiKey</span><span className="text-foreground">:</span> <span className="text-green-600">"dev_92...281"</span>,<br/>
              &nbsp;&nbsp;<span className="text-orange-300">env</span><span className="text-foreground">:</span> <span className="text-green-600">"production"</span><br/>
              <span className="text-yellow-300">{`}`}</span><span className="text-foreground">;</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function BookmarkItem({ icon, title, url }: { icon: React.ReactNode, title: string, url: string }) {
  return (
    <div className="flex items-center justify-between py-2 group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border/50 text-foreground">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground/90">{title}</div>
          <div className="text-xs text-foreground/60">{url}</div>
        </div>
      </div>
      <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="text-xs font-semibold text-foreground/60 hover:text-foreground flex items-center gap-1.5 transition-colors">
          Copy
        </button>
        <button className="text-foreground/60 hover:text-foreground transition-colors">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CredentialItem({ title }: { title: string }) {
  return (
    <div className="bg-secondary rounded-lg p-4 border border-border">
      <div className="text-[10px] font-bold text-foreground/60 tracking-wider mb-3">{title}</div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1 items-center">
          <div className="flex gap-0.5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
            ))}
          </div>
        </div>
        <button className="text-primary hover:text-primary/80 transition-colors">
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ToolCard({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
  return (
    <Link href={href}>
      <div className="bg-secondary hover:bg-accent border border-border rounded-lg p-5 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer group h-[100px]">
        <div className="group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div className="text-[10px] font-bold text-foreground/80 tracking-widest text-center">
          {label}
        </div>
      </div>
    </Link>
  );
}
