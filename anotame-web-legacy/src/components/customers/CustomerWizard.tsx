"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PersonalStep } from "./wizard/PersonalStep";
import { ContactStep } from "./wizard/ContactStep";
import { createCustomer } from "@/services/sales/customers";
import { useAuth } from "@/context/AuthContext";
import { CustomerDto } from "@/types/dtos";

export function CustomerWizard() {
    const router = useRouter();

    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [data, setData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: ""
    });

    const updateData = (updates: Partial<typeof data>) => {
        setData(prev => ({ ...prev, ...updates }));
        if (error) setError(null); // Clear error on user input
    };

    const handleNext = () => {
        setStep(prev => prev + 1);
        setError(null);
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(prev => prev - 1);
            setError(null);
        } else {
            router.back();
        }
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const payload: CustomerDto = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phoneNumber: data.phoneNumber
            };

            await createCustomer(payload);
            router.push("/dashboard/customers");
        } catch (err: any) {
            console.error("Failed to create customer", err);
            // Translate common errors
            let msg = err.message || "Error al crear cliente.";
            if (msg.includes("Email already in use")) {
                msg = "Este correo electrónico ya está registrado.";
            }
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        { title: "Personal", component: PersonalStep },
        { title: "Contacto", component: ContactStep }
    ];

    const CurrentStep = steps[step].component;

    return (
        <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
            {/* Stepper Header */}
            <div className="flex items-center justify-center mb-8 gap-4">
                {steps.map((s, i) => (
                    <div key={i} className="flex items-center">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors
                            ${step === i ? "border-primary bg-primary text-primary-foreground" :
                                    step > i ? "border-primary bg-primary/20 text-primary" : "border-muted text-muted-foreground"}`}
                        >
                            {i + 1}
                        </div>
                        <span className={`ml-2 text-sm font-medium hidden sm:inline ${step === i ? "text-foreground" : "text-muted-foreground"}`}>
                            {s.title}
                        </span>
                        {i < steps.length - 1 && <div className="w-12 h-0.5 bg-border mx-4" />}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[400px]">
                <CurrentStep
                    data={data}
                    updateData={updateData}
                    onNext={step === steps.length - 1 ? handleComplete : handleNext}
                    onBack={handleBack}
                    isSubmitting={isSubmitting}
                    error={error}
                />
            </div>
        </div>
    );
}
