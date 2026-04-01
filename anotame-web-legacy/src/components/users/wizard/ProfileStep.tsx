"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Check } from "lucide-react";
import { CreateUserRequest } from "@/types/dtos";

interface ProfileStepProps {
    data: Partial<CreateUserRequest>;
    updateData: (updates: Partial<CreateUserRequest>) => void;
    onNext: () => void;
    onBack: () => void;
    isSubmitting: boolean;
    error?: string | null;
}

export function ProfileStep({ data, updateData, onNext, onBack, isSubmitting, error }: ProfileStepProps) {
    const isValid = (data.firstName?.trim().length || 0) > 0 &&
        (data.lastName?.trim().length || 0) > 0 &&
        (data.email?.trim().length || 0) > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) onNext();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto py-4 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold">Información de Perfil</h2>
                <p className="text-muted-foreground text-sm">Detalles personales del empleado.</p>
                {error && (
                    <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md font-medium">
                        {error}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Nombre"
                        placeholder="Ej. Juan"
                        value={data.firstName || ""}
                        onChange={(e) => updateData({ firstName: e.target.value })}
                        autoFocus
                        required
                    />

                    <Input
                        label="Apellido"
                        placeholder="Ej. Pérez"
                        value={data.lastName || ""}
                        onChange={(e) => updateData({ lastName: e.target.value })}
                        required
                    />
                </div>

                <Input
                    label="Correo Electrónico"
                    type="email"
                    placeholder="Ej. juan@empresa.com"
                    value={data.email || ""}
                    onChange={(e) => updateData({ email: e.target.value })}
                    required
                />
            </div>

            <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Atrás
                </Button>
                <Button type="submit" disabled={!isValid || isSubmitting}>
                    {isSubmitting ? "Creando..." : "Crear Usuario"}
                    {!isSubmitting && <Check className="w-4 h-4 ml-2" />}
                </Button>
            </div>
        </form>
    );
}
