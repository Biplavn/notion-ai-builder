"use client";

import { useState } from "react";
import { ArrowLeft, Download, Star, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CURATED_TEMPLATES } from "@/lib/templates/metadata";
import { TEMPLATE_BLUEPRINTS } from "@/lib/templates/blueprints";
import PREBUILT_BLUEPRINTS from "@/lib/templates/prebuilt_blueprints.json";
import { getPreviewBlueprint } from "@/lib/templates/mockBlueprints";
import { GetTemplateModal } from "@/components/GetTemplateModal";

import { UserProfile } from "@/components/auth/UserProfile";

export default function TemplateDetailPage() {
    const params = useParams();
    const router = useRouter();
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
    const [showGetTemplateModal, setShowGetTemplateModal] = useState(false);

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
        setInstallStatus("Preparing your template...");

        try {
            // Create a downloadable JSON file
            const templateData = {
                version: "1.0",
                template: installBlueprint,
                metadata: {
                    name: template.name,
                    description: template.description,
                    author: template.author,
                    createdAt: new Date().toISOString()
                }
            };

            // Convert to JSON and create download
            const jsonString = JSON.stringify(templateData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = `${template.id}-template.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setStep("success");
            setInstallStatus("Downloaded!");
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
                    <h2 className="text-3xl font-bold">Template Downloaded!</h2>
                    <p className="text-muted-foreground">
                        {template.name} has been downloaded. Follow these steps to import it into Notion:
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left space-y-3">
                        <h3 className="font-semibold text-blue-900">How to Import:</h3>
                        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                            <li>Open Notion and go to any page</li>
                            <li>Type <code className="bg-blue-100 px-1 rounded">/import</code> and press Enter</li>
                            <li>Select "Import" → "JSON"</li>
                            <li>Choose the downloaded file</li>
                            <li>Your template will be created! ✨</li>
                        </ol>
                    </div>

                    <div className="pt-4 space-y-3">
                        <Link
                            href="/templates"
                            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                        >
                            Browse More Templates
                        </Link>
                        <div>
                            <Link href="/" className="text-sm text-primary hover:underline">
                                ← Back to home
                            </Link>
                        </div>
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


                            {/* Single "Get Template" Button */}
                            <button
                                onClick={() => setShowGetTemplateModal(true)}
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Get Template
                            </button>

                            <div className="text-sm text-center text-muted-foreground">
                                <p className="font-medium mb-2">Choose your preferred method:</p>
                                <div className="flex items-center justify-center gap-4 text-xs">
                                    {template.duplicateLink && (
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <span>Instant duplicate</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                        <span>AI customization</span>
                                    </div>
                                </div>
                            </div>


                            <div className="pt-4 border-t border-border space-y-3 text-sm text-muted-foreground">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                                    <span>Multiple installation options</span>
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

            {/* Get Template Modal */}
            <GetTemplateModal
                isOpen={showGetTemplateModal}
                onClose={() => setShowGetTemplateModal(false)}
                template={template}
                onSelectDuplicate={() => {
                    if (template.duplicateLink) {
                        window.open(template.duplicateLink, '_blank');
                        setShowGetTemplateModal(false);
                    }
                }}
                onSelectAI={() => {
                    setShowGetTemplateModal(false);
                    router.push(`/?prompt=${encodeURIComponent(`Create a ${template.name}: ${template.description}`)}`);
                }}
            />
        </div>
    );
}
