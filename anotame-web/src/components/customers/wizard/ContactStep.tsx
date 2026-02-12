"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Check } from "lucide-react";

interface ContactStepProps {
    data: {
        email: string;
        phoneNumber: string;
    };
    updateData: (updates: Partial<{ email: string; phoneNumber: string }>) => void;
    onNext: () => void;
    onBack: () => void;
    isSubmitting: boolean;
    error?: string | null;
}

export function ContactStep({ data, updateData, onNext, onBack, isSubmitting, error }: ContactStepProps) {
    const isValid = data.phoneNumber.trim().length > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) onNext();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto py-4 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold">Información de Contacto</h2>
                <p className="text-muted-foreground text-sm">Para notificaciones y seguimiento.</p>
                {error && (
                    <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md font-medium">
                        {error}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <Input
                    label="Teléfono"
                    placeholder="Ej. 555-0123"
                    value={data.phoneNumber}
                    onChange={(e) => updateData({ phoneNumber: e.target.value })}
                    autoFocus
                    required
                />

                <Input
                    label="Correo Electrónico (Opcional)"
                    type="email"
                    placeholder="Ej. usuario@ejemplo.com"
                    value={data.email}
                    onChange={(e) => updateData({ email: e.target.value })}
                />
            </div>

            <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Atrás
                </Button>
                <Button type="submit" disabled={!isValid || isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Crear Cliente"}
                    {!isSubmitting && <Check className="w-4 h-4 ml-2" />}
                </Button>
            </div>
        </form>
    );
}
