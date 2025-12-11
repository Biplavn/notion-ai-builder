"use client";

import { X, Copy, Sparkles, ArrowRight, Zap } from "lucide-react";

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
}

export function GetTemplateModal({
    isOpen,
    onClose,
    template,
    onSelectDuplicate,
    onSelectAI
}: GetTemplateModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-2xl rounded-xl shadow-xl border border-border p-8 relative animate-in zoom-in-95 duration-200 m-4">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
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
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {/* Option 1: Duplicate Link */}
                    {template.duplicateLink && (
                        <button
                            onClick={onSelectDuplicate}
                            className="group relative p-6 rounded-xl border-2 border-border hover:border-primary transition-all duration-300 text-left bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg"
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
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </button>
                    )}

                    {/* Option 2: AI Generation */}
                    <button
                        onClick={onSelectAI}
                        className="group relative p-6 rounded-xl border-2 border-border hover:border-accent transition-all duration-300 text-left bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg"
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">💡</div>
                        <div>
                            <p className="font-semibold mb-1">Not sure which to choose?</p>
                            <p className="text-xs">
                                <strong>Duplicate</strong> is perfect if you want to start immediately with a proven template.
                                <strong> AI Generation</strong> is ideal if you need specific customizations or want to match your unique workflow.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
