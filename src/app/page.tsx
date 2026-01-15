"use client";

import { ArrowRight, Sparkles, Search, Copy, ExternalLink, Database, CheckCircle, LayoutTemplate, Loader2, Rocket, X } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { TemplateGallery } from "@/components/TemplateGallery";
import { UserProfile } from "@/components/auth/UserProfile";
import { TemplateBlueprint } from "@/lib/types/blueprint";
import { BlueprintPreview } from "@/components/BlueprintPreview";

import { useUser } from "@/lib/useUser";
import { LoginModal } from "@/components/auth/LoginModal";
import { LimitModal } from "@/components/LimitModal";

export const dynamic = 'force-dynamic';

interface BuildResult {
  pageId: string;
  notionUrl: string;
  duplicateLink: string;
}

function HomeContent() {
  const { user, loading, canUseAI, supabase } = useUser();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLimitOpen, setIsLimitOpen] = useState(false);
  const [limitReason, setLimitReason] = useState<"trial_expired" | "limit_reached">("limit_reached");

  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  const [copied, setCopied] = useState(false);

  const [step, setStep] = useState<"input" | "preview" | "success">("input");
  const [blueprint, setBlueprint] = useState<TemplateBlueprint | null>(null);

  // Handle URL prompt parameter (from template modal "Build with AI")
  useEffect(() => {
    const urlPrompt = searchParams.get("prompt");
    if (urlPrompt) {
      setPrompt(urlPrompt);
    }
  }, [searchParams]);

  const handleGenerate = async () => {
    if (!prompt) return;

    if (!user) {
      setIsLoginOpen(true);
      return;
    }

    if (!canUseAI) {
      setLimitReason("limit_reached");
      setIsLimitOpen(true);
      return;
    }

    setIsLoading(true);
    setStatus("Designing your template...");

    try {
      const res = await fetch("/api/ai/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to generate blueprint");

      setBlueprint(data.blueprint);
      setStep("preview");
      setStatus("");
    } catch (error: any) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmBuild = async (finalBlueprint: TemplateBlueprint) => {
    setIsLoading(true);
    setStatus("Building your template in Notion (this may take 30-60 seconds)...");

    try {
      // Use the new admin build endpoint
      const buildRes = await fetch("/api/ai/build-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprint: finalBlueprint }),
      });
      const buildData = await buildRes.json();

      if (!buildRes.ok) throw new Error(buildData.error || "Build failed");

      // Increment usage count in Supabase
      if (user?.id) {
        await supabase
          .from('users')
          .update({
            ai_generations_lifetime: (user.ai_generations_lifetime || 0) + 1
          })
          .eq('id', user.id);
      }

      setBuildResult({
        pageId: buildData.pageId,
        notionUrl: buildData.notionUrl,
        duplicateLink: buildData.duplicateLink
      });
      setStep("success");
      setStatus("Done!");
    } catch (error: any) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (buildResult?.duplicateLink) {
      navigator.clipboard.writeText(buildResult.duplicateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setStep("input");
    setPrompt("");
    setBuildResult(null);
    setBlueprint(null);
    setStatus("");
    setCopied(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
              N
            </div>
            <span className="text-xl font-bold">NotionStruct</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/education" className="text-muted-foreground hover:text-foreground transition-colors">
              Education
            </Link>
            <UserProfile />
          </div>
        </div>
      </nav>

      <main className="flex flex-col gap-8 items-center text-center max-w-7xl w-full mx-auto px-6 pt-24 pb-12">

        {/* Hero Section */}
        {step === "input" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium border border-border">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>AI-Powered Notion Architect</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-primary">
              Build your dream <br />
              <span className="text-accent">Notion Workspace</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Search for ready-to-use templates or describe what you need, and we'll build it for you.
            </p>
          </div>
        )}

        {/* Input Section */}
        {step === "input" && (
          <div className="w-full max-w-2xl mt-4 relative group z-10">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-background border border-border rounded-xl shadow-lg p-2 flex items-center gap-2">
              <Search className="w-5 h-5 text-muted-foreground ml-3" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Search templates or describe a new one..."
                className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-lg placeholder:text-muted-foreground/50"
                disabled={isLoading}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Design New"}
                {!isLoading && <Sparkles className="w-4 h-4" />}
              </button>
            </div>

            {/* Status */}
            <div className="mt-4 text-center min-h-[24px]">
              {isLoading && <span className="text-sm text-muted-foreground animate-pulse">{status}</span>}
              {!isLoading && status && <span className="text-sm text-red-500">{status}</span>}
            </div>
          </div>
        )}

        {/* Template Gallery Section */}
        {step === "input" && (
          <div className="w-full mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-left">
                {prompt ? "Matching Templates" : "Ready-to-Use Templates"}
              </h2>
            </div>

            <TemplateGallery searchQuery={prompt} />

            {!prompt && (
              <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
                <FeatureCard
                  icon={<Database className="w-6 h-6 text-accent" />}
                  title="Smart Databases"
                  description="Automatically creates databases with correct property types and relations."
                />
                <FeatureCard
                  icon={<LayoutTemplate className="w-6 h-6 text-purple-500" />}
                  title="Complete Templates"
                  description="Generates dashboards, views, and content blocks, not just empty tables."
                />
                <FeatureCard
                  icon={<Sparkles className="w-6 h-6 text-amber-500" />}
                  title="Instant Duplicate"
                  description="Get a link to duplicate the template directly to your Notion workspace."
                />
              </div>
            )}
          </div>
        )}

        {/* Preview Section */}
        {step === "preview" && blueprint && (
          <BlueprintPreview
            blueprint={blueprint!}
            onConfirm={handleConfirmBuild}
            onCancel={() => { setStep("input"); setBlueprint(null); }}
            isBuilding={isLoading}
            status={status}
          />
        )}

        {/* Success Section - Beautiful Duplicate Link UI */}
        {step === "success" && buildResult && (
          <div className="animate-in zoom-in duration-500 flex flex-col items-center gap-6 max-w-lg mx-auto">
            {/* Success Animation */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Your Template is Ready! 🎉
              </h2>
              <p className="text-muted-foreground">
                {blueprint?.title} has been created. Click below to add it to your Notion workspace.
              </p>
            </div>

            {/* Primary CTA - Duplicate Button */}
            <button
              onClick={() => {
                // Open in a popup window with specific dimensions for better UX
                const width = 800;
                const height = 600;
                const left = (window.screen.width - width) / 2;
                const top = (window.screen.height - height) / 2;
                window.open(
                  buildResult.duplicateLink,
                  'notion-duplicate',
                  `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
                );
              }}
              className="w-full bg-gradient-to-r from-primary to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3 cursor-pointer"
            >
              <Rocket className="w-5 h-5" />
              Duplicate to My Notion
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* Alternative - Open Page Directly */}
            <button
              onClick={() => {
                window.open(buildResult.notionUrl, '_blank');
              }}
              className="w-full bg-muted hover:bg-muted/80 text-foreground px-6 py-3 rounded-xl font-medium text-base transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Or open page directly in Notion
            </button>

            {/* Instructions */}
            <div className="w-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-5 text-left">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <span className="text-lg">📋</span> How it works:
              </h3>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
                <li>Click the button above to open Notion</li>
                <li>If a popup appears, choose your workspace and click "Duplicate"</li>
                <li>If no popup appears, click "..." menu → "Duplicate" in Notion</li>
                <li>Your template is now in your Notion! ✨</li>
              </ol>
            </div>

            {/* Copy Link Option */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-4 rounded-lg hover:bg-muted"
            >
              <Copy className="w-4 h-4" />
              {copied ? "Link copied!" : "Copy duplicate link"}
            </button>

            {/* Secondary Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-border w-full justify-center">
              <button
                onClick={handleReset}
                className="text-primary hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-4 h-4" />
                Create another template
              </button>
              <span className="text-muted-foreground">•</span>
              <Link href="/templates" className="text-primary hover:underline">
                Browse templates
              </Link>
            </div>
          </div>
        )}

      </main>

      <footer className="mt-24 text-sm text-muted-foreground flex flex-col items-center gap-2 pb-8">
        <p>Powered by OpenAI & Notion API</p>
        <p>
          Built by{" "}
          <a
            href="https://www.bartlabs.in"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            Bartlabs
          </a>
        </p>
      </footer>

      {/* Modals */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <LimitModal
        isOpen={isLimitOpen}
        onClose={() => setIsLimitOpen(false)}
        reason={limitReason}
      />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
