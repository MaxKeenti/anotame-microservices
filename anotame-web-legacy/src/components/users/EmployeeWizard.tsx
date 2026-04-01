"use client";

import { useState } from "react";
import { AccountStep } from "./wizard/AccountStep";
import { ProfileStep } from "./wizard/ProfileStep";
import * as UserService from "@/services/identity/users";
import { CreateUserRequest } from "@/types/dtos";

interface EmployeeWizardProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function EmployeeWizard({ onSuccess, onCancel }: EmployeeWizardProps) {
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [data, setData] = useState<Partial<CreateUserRequest>>({
        role: "EMPLOYEE"
    });

    const updateData = (updates: Partial<CreateUserRequest>) => {
        setData(prev => ({ ...prev, ...updates }));
        if (error) setError(null);
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
            onCancel();
        }
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            // Validate required fields
            if (!data.username || !data.password || !data.firstName || !data.lastName || !data.email) {
                throw new Error("Faltan campos requeridos.");
            }

            await UserService.createUser(data as CreateUserRequest);
            onSuccess();
        } catch (err: any) {
            console.error("Failed to create user", err);
            setError(err.message || "Error al crear usuario.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        { title: "Cuenta", component: AccountStep },
        { title: "Perfil", component: ProfileStep }
    ];

    const CurrentStep = steps[step].component;

    return (
        <div className="flex flex-col h-full w-full">
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
