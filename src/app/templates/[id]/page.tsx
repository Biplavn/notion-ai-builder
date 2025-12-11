"use client";

import { useState } from "react";
import { ArrowLeft, Download, Star, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CURATED_TEMPLATES } from "@/lib/templates/metadata";
import { TEMPLATE_BLUEPRINTS } from "@/lib/templates/blueprints";
import PREBUILT_BLUEPRINTS from "@/lib/templates/prebuilt_blueprints.json";
import { getPreviewBlueprint } from "@/lib/templates/mockBlueprints";

import { UserProfile } from "@/components/auth/UserProfile";

export default function TemplateDetailPage() {
    const params = useParams();
    const templateId = params.id as string;

    const template = CURATED_TEMPLATES.find(t => t.id === templateId);
    // Prioritize pre-built blueprints (generated offline) -> then manual overrides -> then null
    const installBlueprint = (PREBUILT_BLUEPRINTS as any)[templateId] || TEMPLATE_BLUEPRINTS[templateId];
    // Use real blueprint if available, otherwise generate a preview one
    const displayBlueprint = installBlueprint || (template ? getPreviewBlueprint(template) : null);

    const [isInstalling, setIsInstalling] = useState(false);
    const [installStatus, setInstallStatus] = useState("");
    const [resultPageId, setResultPageId] = useState<string | null>(null);
    const [step, setStep] = useState<"details" | "success">("details");

    if (!template) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Template not found</h1>
                    <Link href="/" className="text-primary hover:underline">
                        ← Back to home
                    </Link>
                </div>
            </div>
        );
    }

    const handleInstall = async () => {
        if (!installBlueprint) {
            setInstallStatus("This template is not yet available. Coming soon!");
            return;
        }

        setIsInstalling(true);
        setInstallStatus("Finding your Notion workspace...");

        try {
            // Find a parent page
            const searchRes = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const searchData = await searchRes.json();

            if (!searchRes.ok) throw new Error(searchData.error || "Failed to find parent page");
            const parentPageId = searchData.pageId;

            setInstallStatus("Building your template in Notion...");

            // Build
            const buildRes = await fetch("/api/notion/build", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    blueprint: installBlueprint,
                    parentPageId
                }),
            });
            const buildData = await buildRes.json();

            if (!buildRes.ok) throw new Error(buildData.error || "Build failed");

            setResultPageId(buildData.pageId);
            setStep("success");
            setInstallStatus("Done!");
        } catch (error: any) {
            console.error(error);
            setInstallStatus(`Error: ${error.message}`);
        } finally {
            setIsInstalling(false);
        }
    };

    if (step === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="max-w-md w-full text-center space-y-6 animate-in zoom-in duration-500">
                    <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold">Template Installed!</h2>
                    <p className="text-muted-foreground">
                        {template.name} has been successfully added to your Notion workspace.
                    </p>
                    {resultPageId && (
                        <a
                            href={`https://notion.so/${resultPageId.replace(/-/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                        >
                            Open in Notion <ArrowRight className="w-4 h-4" />
                        </a>
                    )}
                    <div className="pt-4">
                        <Link href="/templates" className="text-primary hover:underline">
                            ← Browse more templates
                        </Link>
                    </div>
                </div>
            </div>
        );
    }



    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navigation Header */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold">
                        NotionStruct
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/education"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Education
                        </Link>
                        <UserProfile />
                    </div>
                </div>
            </nav>

            {/* Header */}
            <div className="border-b border-border pt-20">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to home</span>
                    </Link>
                </div>
            </div>

            {/* Template Details */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="grid md:grid-cols-3 gap-12">
                    {/* Left Column - Details */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Header */}
                        <div>
                            <div className="flex items-start gap-4 mb-4">
                                <div className="text-6xl">{template.icon}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-4xl font-bold">{template.name}</h1>
                                        {template.isPro ? (
                                            <span className="px-3 py-1 text-sm font-semibold rounded bg-accent/10 text-accent border border-accent/20">
                                                PRO
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 text-sm font-semibold rounded bg-green-500/10 text-green-600 border border-green-500/20">
                                                FREE
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xl text-muted-foreground">{template.description}</p>
                                </div>
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    <span>{template.downloads} installs</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                    <span>{template.rating} rating</span>
                                </div>
                                <div>
                                    <span>by {template.author}</span>
                                </div>
                            </div>
                        </div>

                        {/* Preview Gallery */}
                        {template.previewImage && (
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3">PREVIEW</h3>
                                <div className="space-y-4">
                                    {/* Main Preview Image */}
                                    <div className="rounded-xl border-2 border-border overflow-hidden bg-white shadow-lg">
                                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                                            <div className="flex gap-1.5">
                                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            </div>
                                            <div className="flex-1 text-center text-xs text-gray-600 font-medium">
                                                {template.name} - Notion
                                            </div>
                                        </div>
                                        <img
                                            src={template.previewImage}
                                            alt={`${template.name} preview`}
                                            className="w-full"
                                        />
                                    </div>

                                    {/* Preview Description */}
                                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                        <div className="flex items-start gap-3">
                                            <div className="text-2xl">👁️</div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-blue-900 mb-1">Live Preview</h4>
                                                <p className="text-sm text-blue-800">
                                                    This is exactly how the template will appear in your Notion workspace after installation.
                                                    All databases, properties, and layouts are pre-configured and ready to use.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">TAGS</h3>
                            <div className="flex flex-wrap gap-2">
                                {template.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 text-sm rounded-full bg-muted text-foreground"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Template Structure */}
                        {displayBlueprint && (
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3">TEMPLATE STRUCTURE</h3>
                                <div className="space-y-4">
                                    {/* Databases */}
                                    {displayBlueprint.databases.length > 0 && (
                                        <div className="border border-border rounded-xl overflow-hidden">
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-border">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">📊</span>
                                                    <div>
                                                        <div className="font-bold text-gray-900">
                                                            {displayBlueprint.databases.length} Database{displayBlueprint.databases.length > 1 ? 's' : ''}
                                                        </div>
                                                        <div className="text-xs text-gray-600">Organized data tables</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 space-y-4 bg-white">
                                                {displayBlueprint.databases.map((db: any, idx: number) => (
                                                    <div key={db.key} className="border border-gray-200 rounded-lg overflow-hidden">
                                                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                                                            <div className="font-semibold text-sm text-gray-900">{db.title}</div>
                                                            {db.description && (
                                                                <div className="text-xs text-gray-600 mt-0.5">{db.description}</div>
                                                            )}
                                                        </div>
                                                        <div className="p-3">
                                                            <div className="text-xs font-semibold text-gray-500 mb-2">
                                                                {Object.keys(db.properties).length} Properties:
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {Object.entries(db.properties || {}).map(([name, prop]: [string, any]) => (
                                                                    <span
                                                                        key={name}
                                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 border border-blue-200"
                                                                    >
                                                                        <span className="font-medium">{name}</span>
                                                                        <span className="text-blue-500">({prop.type})</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Pages */}
                                    {displayBlueprint.pages.length > 0 && (
                                        <div className="border border-border rounded-xl overflow-hidden">
                                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-border">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">📄</span>
                                                    <div>
                                                        <div className="font-bold text-gray-900">
                                                            {displayBlueprint.pages.length} Page{displayBlueprint.pages.length > 1 ? 's' : ''}
                                                        </div>
                                                        <div className="text-xs text-gray-600">Pre-built content pages</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 space-y-3 bg-white">
                                                {displayBlueprint.pages?.map((page: any, idx: number) => (
                                                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                                                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                                                            {page.icon && <span className="text-lg">{page.icon}</span>}
                                                            <div className="font-semibold text-sm text-gray-900">{page.title}</div>
                                                        </div>
                                                        <div className="p-3">
                                                            <div className="text-xs font-semibold text-gray-500 mb-2">
                                                                {page.blocks.length} Content Blocks:
                                                            </div>
                                                            <div className="space-y-1">
                                                                {page.blocks?.map((block: any, blockIdx: number) => (
                                                                    <div key={blockIdx} className="flex items-center gap-2 text-xs text-gray-600">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                                                        <span className="capitalize">{block.type.replace(/_/g, ' ')}</span>
                                                                        {block.content && (
                                                                            <span className="text-gray-400 truncate">
                                                                                - {block.content.substring(0, 40)}...
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {page.blocks.length > 5 && (
                                                                    <div className="text-xs text-gray-400 italic">
                                                                        + {page.blocks.length - 5} more blocks
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Install Card */}
                    <div className="md:col-span-1">
                        <div className="sticky top-6 p-6 rounded-xl border border-border bg-card shadow-lg space-y-4">
                            <div className="text-center">
                                {template.price > 0 ? (
                                    <div className="text-3xl font-bold">${template.price}</div>
                                ) : (
                                    <div className="text-3xl font-bold text-green-600">Free</div>
                                )}
                            </div>

                            {installBlueprint ? (
                                <>
                                    <button
                                        onClick={handleInstall}
                                        disabled={isInstalling}
                                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isInstalling ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Installing...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" />
                                                Install to Notion
                                            </>
                                        )}
                                    </button>

                                    {installStatus && (
                                        <div className="text-sm text-center text-muted-foreground">
                                            {installStatus}
                                        </div>
                                    )}

                                    <div className="text-sm text-center text-muted-foreground space-y-2">
                                        <p className="font-medium">One-click installation:</p>
                                        <ol className="text-left space-y-1 text-xs">
                                            <li>1. Click "Install to Notion" above</li>
                                            <li>2. Template builds in your workspace</li>
                                            <li>3. Start using immediately ✅</li>
                                        </ol>
                                    </div>
                                </>
                            ) : template.duplicateLink ? (
                                <>
                                    <a
                                        href={template.duplicateLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Get Template
                                    </a>

                                    <div className="text-sm text-center text-muted-foreground space-y-2">
                                        <p className="font-medium">How to install:</p>
                                        <ol className="text-left space-y-1 text-xs">
                                            <li>1. Click "Get Template" above</li>
                                            <li>2. Click "Duplicate" in Notion</li>
                                            <li>3. Template added to your workspace ✅</li>
                                        </ol>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href={`/?prompt=${encodeURIComponent(`Create a ${template.name}: ${template.description}`)}`}
                                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Star className="w-4 h-4" />
                                        Build with AI
                                    </Link>

                                    <div className="text-sm text-center text-muted-foreground space-y-2">
                                        <p className="font-medium">Custom AI Generation:</p>
                                        <p className="text-xs">
                                            This template will be custom-built by our AI to match your exact needs.
                                            Click above to start!
                                        </p>
                                    </div>
                                </>
                            )}

                            <div className="pt-4 border-t border-border space-y-3 text-sm text-muted-foreground">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                                    <span>One-click installation</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                                    <span>Fully customizable</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                                    <span>Lifetime access</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
