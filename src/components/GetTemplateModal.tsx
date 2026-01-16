"use client";

import { X, Copy, Sparkles, ArrowRight, Zap, ExternalLink, Download } from "lucide-react";

interface GetTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: {
        id: string;
        name: string;
        description: string;
        icon: string;
        duplicateLink?: string;
        isPro: boolean;
    };
    onSelectDuplicate: () => void;
    onSelectAI: () => void;
    onSelectDownload?: () => void;
    hasBlueprint?: boolean;
}

export function GetTemplateModal({
    isOpen,
    onClose,
    template,
    onSelectDuplicate,
    onSelectAI,
    onSelectDownload,
    hasBlueprint = false
}: GetTemplateModalProps) {
    if (!isOpen) return null;

    const hasDuplicateLink = Boolean(template.duplicateLink);
    const canDownload = hasBlueprint && onSelectDownload;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-2xl rounded-2xl shadow-2xl border border-border p-8 relative animate-in zoom-in-95 duration-200 m-4">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">{template.icon}</div>
                    <h2 className="text-3xl font-bold mb-2">Get {template.name}</h2>
                    <p className="text-muted-foreground">
                        Choose how you'd like to add this template to your workspace
                    </p>
                </div>

                {/* Options */}
                <div className={`grid gap-4 mb-6 ${(hasDuplicateLink || canDownload) ? 'md:grid-cols-2' : 'max-w-md mx-auto'}`}>
                    {/* Option 1: Duplicate Link */}
                    {hasDuplicateLink && (
                        <button
                            onClick={onSelectDuplicate}
                            className="group relative p-6 rounded-xl border-2 border-primary/30 hover:border-primary transition-all duration-300 text-left bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg hover:shadow-primary/10"
                        >
                            <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                                INSTANT
                            </div>

                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Copy className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-bold mb-2">Duplicate to Notion</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Get the exact template instantly. One click to duplicate into your workspace.
                            </p>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-green-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                                    <span>Instant access</span>
                                </div>
                                <div className="flex items-center gap-2 text-green-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                                    <span>Pre-built & ready to use</span>
                                </div>
                                <div className="flex items-center gap-2 text-green-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                                    <span>No AI credits needed</span>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                                <span>Open in Notion</span>
                                <ExternalLink className="w-4 h-4" />
                            </div>
                        </button>
                    )}

                    {/* Option 2: Download JSON Blueprint */}
                    {canDownload && (
                        <button
                            onClick={onSelectDownload}
                            className="group relative p-6 rounded-xl border-2 border-green-500/30 hover:border-green-500 transition-all duration-300 text-left bg-gradient-to-br from-green-500/5 to-emerald-500/10 hover:shadow-lg hover:shadow-green-500/10"
                        >
                            <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                                DOWNLOAD
                            </div>

                            <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Download className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-bold mb-2">Download Template</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Download as JSON file to import into Notion manually.
                            </p>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-green-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                                    <span>Offline access</span>
                                </div>
                                <div className="flex items-center gap-2 text-green-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                                    <span>Import via Notion</span>
                                </div>
                                <div className="flex items-center gap-2 text-green-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                                    <span>No credits needed</span>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-green-600 font-medium group-hover:gap-3 transition-all">
                                <span>Download JSON</span>
                                <Download className="w-4 h-4" />
                            </div>
                        </button>
                    )}

                    {/* Option 3: AI Generation */}
                    <button
                        onClick={onSelectAI}
                        className="group relative p-6 rounded-xl border-2 border-accent/30 hover:border-accent transition-all duration-300 text-left bg-gradient-to-br from-accent/5 to-purple-500/10 hover:shadow-lg hover:shadow-accent/10"
                    >
                        <div className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded">
                            CUSTOM
                        </div>

                        <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Sparkles className="w-6 h-6" />
                        </div>

                        <h3 className="text-xl font-bold mb-2">Build with AI</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Customize the template with AI. Tailored to your specific needs and workflow.
                        </p>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-purple-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                                <span>Fully customizable</span>
                            </div>
                            <div className="flex items-center gap-2 text-purple-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                                <span>AI-powered generation</span>
                            </div>
                            <div className="flex items-center gap-2 text-purple-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                                <span>Match your workflow</span>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-accent font-medium group-hover:gap-3 transition-all">
                            <span>Generate custom</span>
                            <Zap className="w-4 h-4" />
                        </div>
                    </button>
                </div>

                {/* Info */}
                <div className="bg-muted/50 border border-border rounded-xl p-4 text-sm">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">💡</div>
                        <div>
                            <p className="font-semibold mb-1">Not sure which to choose?</p>
                            <p className="text-muted-foreground text-xs">
                                {hasDuplicateLink ? (
                                    <>
                                        <strong>Duplicate</strong> is perfect if you want to start immediately with a proven template.{" "}
                                        <strong>AI Generation</strong> is ideal if you need specific customizations.
                                    </>
                                ) : canDownload ? (
                                    <>
                                        <strong>Download</strong> gives you a JSON file to import into Notion.{" "}
                                        <strong>AI Generation</strong> creates a customized version tailored to your needs.
                                    </>
                                ) : (
                                    <>
                                        <strong>AI Generation</strong> creates a custom template based on this template's concept,
                                        tailored to your specific needs. You'll get a duplicate link after generation.
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
