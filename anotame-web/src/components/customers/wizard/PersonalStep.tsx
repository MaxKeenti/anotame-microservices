"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface PersonalStepProps {
    data: {
        firstName: string;
        lastName: string;
    };
    updateData: (updates: Partial<{ firstName: string; lastName: string }>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function PersonalStep({ data, updateData, onNext, onBack }: PersonalStepProps) {
    const isValid = data.firstName.trim().length > 0 && data.lastName.trim().length > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) onNext();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto py-4 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold">Información Personal</h2>
                <p className="text-muted-foreground text-sm">Comencemos por lo básico.</p>
            </div>

            <div className="space-y-4">
                <Input
                    label="Nombre"
                    placeholder="Ej. Juan"
                    value={data.firstName}
                    onChange={(e) => updateData({ firstName: e.target.value })}
                    autoFocus
                    required
                />

                <Input
                    label="Apellidos"
                    placeholder="Ej. Pérez"
                    value={data.lastName}
                    onChange={(e) => updateData({ lastName: e.target.value })}
                    required
                />
            </div>

            <div className="flex justify-between pt-4">
                <Button type="button" variant="ghost" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancelar
                </Button>
                <Button type="submit" disabled={!isValid}>
                    Siguiente
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </form>
    );
}
