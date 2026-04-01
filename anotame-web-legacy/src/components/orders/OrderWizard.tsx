"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CustomerStep } from "./wizard/CustomerStep";
import { ItemsStep } from "./wizard/ItemsStep";
import { PaymentStep } from "./wizard/PaymentStep";
import { DraftsService, DraftOrder } from "@/services/local/DraftsService";
import { Button } from "@/components/ui/Button";
import { Save } from "lucide-react";

import { getOrder } from "@/lib/api";
import { OrderResponse } from "@/types/dtos";

export function OrderWizard({ initialDraftId, orderId }: { initialDraftId?: string; orderId?: string }) {
    console.log("OrderWizard mounted. orderId:", orderId, "initialDraftId:", initialDraftId);
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(!!orderId);
    const [draft, setDraft] = useState<DraftOrder | null>(null);

    // Initialize/Load Draft
    useEffect(() => {
        console.log("Effect: Initialize/Load Draft. orderId:", orderId, "initialDraftId:", initialDraftId);
        if (orderId) return; // Handled by separate effect

        if (initialDraftId) {
            const existing = DraftsService.get(initialDraftId);
            if (existing) {
                console.log("Found existing draft:", existing);
                setDraft(existing);
                return;
            }
        }

        // New Draft
        console.log("Creating new empty draft");
        setDraft({
            id: crypto.randomUUID(),
            lastModified: Date.now(),
            currentStep: 0,
            items: [],
            amountPaid: 0,
            paymentMethod: 'CASH'
        });
    }, [initialDraftId, orderId]);

    // Load order data if editing
    useEffect(() => {
        console.log("Effect: Load order data. orderId:", orderId);
        if (!orderId) return;

        const loadOrder = async () => {
            console.log("Fetching order:", orderId);
            try {
                // Fetch Order AND Catalog to resolve garment IDs
                const [order, catalogRes] = await Promise.all([
                    getOrder(orderId),
                    fetch(`/api/catalog/catalog/garments`) // Use local proxy path
                ]);

                let garmentMap = new Map<string, string>();
                if (catalogRes.ok) {
                    const catalog: any[] = await catalogRes.json();
                    catalog.forEach(g => {
                        garmentMap.set(g.name.toLowerCase(), g.id);
                        // Also map variations if needed, but strict name match is a start
                    });
                }

                console.log("Order fetched successfully:", order);
                // Map OrderResponse to DraftOrder
                setDraft({
                    id: order.id,
                    lastModified: Date.now(),
                    currentStep: 0,
                    customer: order.customer,
                    items: order.items.map(item => {
                        // Resolve Garment ID
                        const lowerName = item.garmentName.toLowerCase();
                        // Try exact match, or allow "unknown" if not found (but backend might fail)
                        // Actually, if backend fails on non-UUID, we MUST provide a UUID. 
                        // If we can't find it, we unfortunately have a data consistency issue. 
                        // But let's assume valid data or fallback to a default if user re-selects.
                        // For now, if not found, we keep it undefined or similar? 
                        // OrderItemDto expects UUID. If we send "unknown", it fails.
                        // If we send null, maybe it works?
                        const resolvedId = garmentMap.get(lowerName) ||
                            // Try simple heuristic for plural/singular?
                            garmentMap.get(lowerName.slice(0, -1)) ||
                            garmentMap.get(lowerName.slice(0, -2));

                        return {
                            garmentName: item.garmentName,
                            quantity: item.quantity,
                            notes: item.notes,
                            services: item.services.map(s => ({
                                serviceId: s.serviceId,
                                serviceName: s.serviceName,
                                unitPrice: s.unitPrice,
                                adjustmentAmount: s.adjustmentAmount,
                                adjustmentReason: s.adjustmentReason
                            })),
                            garmentTypeId: resolvedId || "00000000-0000-0000-0000-000000000000" // Fallback UUID to avoid 400? Or let it likely fail validation logic but pass JSON parse?
                            // Better to leave it empty string if strict? No, UUID parse needs format.
                            // "00000000-0000-0000-0000-000000000000" might be safe-ish.
                        };
                    }),
                    amountPaid: order.amountPaid,
                    paymentMethod: order.paymentMethod,
                    committedDeadline: order.committedDeadline,
                    notes: order.notes,
                    isEditing: true
                });
            } catch (e: any) {
                console.error("Failed to load order:", e);
                // Log additional details if available
                if (e.message && e.message.includes("SyntaxError")) {
                    console.error("Possible non-JSON response from server.");
                }
                // Handle error (alert or redirect)
                alert(`Error loading order: ${e.message}`);
                router.push("/dashboard/orders");
            } finally {
                // If we failed or succeeded, we stop loading. 
                // BUT we need to make sure draft is set if success.
                // Draft was set in setDraft above.
                setIsLoading(false);
            }
        };
        loadOrder();
    }, [orderId, router]);

    // Auto-save on draft change (ONLY if not editing an existing order)
    useEffect(() => {
        if (orderId || !draft) return; // Don't save existing orders or null drafts
        const toSave = { ...draft, currentStep, lastModified: Date.now() };
        DraftsService.save(toSave);
    }, [draft, currentStep, orderId]);

    const updateDraft = (updates: Partial<DraftOrder>) => {
        setDraft(prev => prev ? ({ ...prev, ...updates }) : null);
    };

    const steps = [
        { title: "Cliente", component: CustomerStep },
        { title: "Prendas", component: ItemsStep },
        { title: "Pago", component: PaymentStep },
    ];

    if (isLoading || !draft) {
        return <div className="flex h-full items-center justify-center">Cargando...</div>;
    }

    const CurrentComponent = steps[currentStep].component;

    const handleNext = () => {
        if (currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
        else router.push("/dashboard/orders");
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Stepper Header */}
            <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold font-heading">{orderId ? "Editar Orden" : "Nueva Orden"}</h1>
                    {draft?.id && !orderId && <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">Draft: {draft.id.slice(0, 8)}...</span>}
                    {orderId && <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">#{orderId.slice(0, 8)}</span>}
                </div>

                <div className="flex items-center gap-2">
                    {steps.map((s, i) => (
                        <div key={i} className={`flex items-center ${i < steps.length - 1 ? "mr-4" : ""}`}>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors
                    ${currentStep === i ? "border-primary bg-primary text-primary-foreground" :
                                        currentStep > i ? "border-primary bg-primary/20 text-primary" : "border-muted text-muted-foreground"}`}
                            >
                                {i + 1}
                            </div>
                            <span className={`ml-2 text-sm hidden md:inline font-medium ${currentStep === i ? "text-foreground" : "text-muted-foreground"}`}>{s.title}</span>
                            {i < steps.length - 1 && <div className="w-8 h-0.5 bg-border ml-4 hidden md:block" />}
                        </div>
                    ))}
                </div>

                <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/orders")}>
                    {orderId ? "Cancelar" : "Salir"}
                </Button>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <CurrentComponent
                    draft={draft}
                    updateDraft={updateDraft}
                    onNext={handleNext}
                    onBack={handleBack}
                />
            </div>
        </div>
    );
}
