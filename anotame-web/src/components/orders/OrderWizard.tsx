"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CustomerStep } from "./wizard/CustomerStep";
import { ItemsStep } from "./wizard/ItemsStep";
import { PaymentStep } from "./wizard/PaymentStep";
import { DraftsService, DraftOrder } from "@/services/local/DraftsService";
import { Button } from "@/components/ui/Button";
import { Save } from "lucide-react";

export function OrderWizard({ initialDraftId }: { initialDraftId?: string }) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [draft, setDraft] = useState<DraftOrder>(() => {
        // Load existing or create new
        if (initialDraftId) {
            const existing = DraftsService.get(initialDraftId);
            if (existing) return existing;
        }
        return {
            id: crypto.randomUUID(),
            lastModified: Date.now(),
            currentStep: 0,
            items: [],
            amountPaid: 0,
            paymentMethod: 'CASH'
        };
    });

    // Auto-save on draft change
    useEffect(() => {
        // Update local object first
        const toSave = { ...draft, currentStep, lastModified: Date.now() };
        DraftsService.save(toSave);
    }, [draft, currentStep]);

    const updateDraft = (updates: Partial<DraftOrder>) => {
        setDraft(prev => ({ ...prev, ...updates }));
    };

    const steps = [
        { title: "Cliente", component: CustomerStep },
        { title: "Prendas", component: ItemsStep },
        { title: "Pago", component: PaymentStep },
    ];

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
                    <h1 className="text-2xl font-bold font-heading">Nueva Orden</h1>
                    {draft.id && <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">Draft: {draft.id.slice(0, 8)}...</span>}
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
                    Salir
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
