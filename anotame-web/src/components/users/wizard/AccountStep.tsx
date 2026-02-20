"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { CreateUserRequest } from "@/types/dtos";

interface AccountStepProps {
    data: Partial<CreateUserRequest>;
    updateData: (updates: Partial<CreateUserRequest>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function AccountStep({ data, updateData, onNext, onBack }: AccountStepProps) {
    const isValid = (data.username?.trim().length || 0) > 0 &&
        (data.password?.trim().length || 0) > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) onNext();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto py-4 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold">Credenciales de Acceso</h2>
                <p className="text-muted-foreground text-sm">Configure la cuenta del sistema.</p>
            </div>

            <div className="space-y-4">
                <Input
                    label="Nombre de Usuario"
                    placeholder="Ej. jperez"
                    value={data.username || ""}
                    onChange={(e) => updateData({ username: e.target.value })}
                    autoFocus
                    required
                />

                <div className="flex flex-col gap-2">
                    <Select
                        label="Rol"
                        value={data.role || "EMPLOYEE"}
                        onChange={e => updateData({ role: e.target.value })}
                    >
                        <option value="EMPLOYEE">Empleado</option>
                        <option value="ADMIN">Administrador</option>
                    </Select>
                </div>

                <Input
                    label="Contraseña"
                    type="password"
                    placeholder="••••••••"
                    value={data.password || ""}
                    onChange={(e) => updateData({ password: e.target.value })}
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
