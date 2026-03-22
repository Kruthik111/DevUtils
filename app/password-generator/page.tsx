"use client";

import { useState, useEffect } from "react";
import { Copy, RefreshCw, ShieldCheck, Check } from "lucide-react";
import { toast } from "sonner";

export default function PasswordGeneratorPage() {
  const [password, setPassword] = useState("");
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    let charset = "";
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (includeNumbers) charset += "0123456789";
    if (includeSymbols) charset += "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    if (charset === "") {
        setIncludeLowercase(true);
        charset = "abcdefghijklmnopqrstuvwxyz";
    }

    let newPassword = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      newPassword += charset[randomIndex];
    }
    setPassword(newPassword);
    setCopied(false);
  };

  useEffect(() => {
    generatePassword();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Password copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const calculateStrength = () => {
    let score = 0;
    if (length > 12) score += 2;
    else if (length > 8) score += 1;

    if (includeUppercase) score += 1;
    if (includeNumbers) score += 1;
    if (includeSymbols) score += 2;

    if (score >= 5) return { label: "Strong", color: "bg-green-500", text: "text-green-500" };
    if (score >= 3) return { label: "Medium", color: "bg-yellow-500", text: "text-yellow-500" };
    return { label: "Weak", color: "bg-red-500", text: "text-red-500" };
  };

  const strength = calculateStrength();

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8 font-sans w-full">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Password Generator
          </h1>
          <p className="text-foreground/50 text-sm">Create secure, complex passwords for your applications.</p>
        </div>

        <div className="bg-background border border-border rounded-xl p-6 shadow-sm mb-6">
          <div className="relative mb-8">
            <div className="bg-secondary border border-border rounded-lg p-6 flex items-center justify-between">
              <div className="font-mono text-xl sm:text-2xl md:text-3xl break-all tracking-wider text-foreground">
                {password}
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <button 
                  onClick={generatePassword}
                  className="p-3 text-foreground/50 hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                  title="Regenerate"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button 
                  onClick={copyToClipboard}
                  className="p-3 text-primary-foreground hover:text-primary-foreground transition-all rounded-lg bg-primary hover:bg-primary/90 shadow-lg"
                  title="Copy"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="absolute -bottom-3 right-6 flex items-center gap-2 bg-background px-3 py-1 border border-border rounded-full text-xs font-bold">
              <span className="text-foreground/60">Strength:</span>
              <span className={strength.text}>{strength.label}</span>
              <div className="flex gap-1 ml-1">
                <div className={`w-3 h-1.5 rounded-full ${strength.color}`}></div>
                <div className={`w-3 h-1.5 rounded-full ${scoreToBars(strength.label) >= 2 ? strength.color : 'bg-foreground/10'}`}></div>
                <div className={`w-3 h-1.5 rounded-full ${scoreToBars(strength.label) >= 3 ? strength.color : 'bg-foreground/10'}`}></div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-bold text-white/90 uppercase tracking-wide">Password Length: {length}</label>
              </div>
              <input 
                type="range" 
                min="6" 
                max="64" 
                value={length} 
                onChange={(e) => setLength(parseInt(e.target.value))}
                className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Checkbox 
                label="Uppercase (A-Z)" 
                checked={includeUppercase} 
                onChange={setIncludeUppercase} 
              />
              <Checkbox 
                label="Lowercase (a-z)" 
                checked={includeLowercase} 
                onChange={setIncludeLowercase} 
              />
              <Checkbox 
                label="Numbers (0-9)" 
                checked={includeNumbers} 
                onChange={setIncludeNumbers} 
              />
              <Checkbox 
                label="Symbols (!@#$)" 
                checked={includeSymbols} 
                onChange={setIncludeSymbols} 
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function scoreToBars(label: string) {
    if (label === 'Strong') return 3;
    if (label === 'Medium') return 2;
    return 1;
}

function Checkbox({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 p-4 bg-secondary border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors group">
      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-primary border-primary' : 'border-foreground/20 group-hover:border-foreground/40'}`}>
        {checked && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
      <span className="text-sm font-medium text-foreground/90">{label}</span>
      <input 
        type="checkbox" 
        className="hidden" 
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
