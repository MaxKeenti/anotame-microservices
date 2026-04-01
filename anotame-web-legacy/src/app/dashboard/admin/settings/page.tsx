"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Establishment } from "@/types/dtos";
import * as EstablishmentService from "@/services/operations/establishment";

export default function SettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState<Establishment>({
        name: "",
        ownerName: "",
        taxInfo: "{}",
        active: true
    });

    // Helper for Form
    const [taxData, setTaxData] = useState<{ rfc?: string, regime?: string, address?: string, contactPhone?: string }>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await EstablishmentService.getSettings();
            setSettings(data);
            try {
                if (data.taxInfo) setTaxData(JSON.parse(data.taxInfo));
            } catch (e) {
                setTaxData({});
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                ...settings,
                taxInfo: JSON.stringify(taxData)
            };
            await EstablishmentService.updateSettings(payload);
            alert("Settings updated!");
        } catch (err) {
            alert("Failed to update settings");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">Configuración del Establecimiento</h1>

            <form onSubmit={handleSave} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Información General</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            label="Nombre de la Tienda"
                            value={settings.name}
                            onChange={e => setSettings({ ...settings, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Nombre del Propietario"
                            value={settings.ownerName || ""}
                            onChange={e => setSettings({ ...settings, ownerName: e.target.value })}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Información Fiscal y de Recibos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            label="RFC / Tax ID"
                            value={taxData.rfc || ""}
                            onChange={e => setTaxData({ ...taxData, rfc: e.target.value })}
                        />
                        <Input
                            label="Régimen Fiscal"
                            value={taxData.regime || ""}
                            onChange={e => setTaxData({ ...taxData, regime: e.target.value })}
                        />
                        <Input
                            label="Dirección Completa (Para Recibo)"
                            value={taxData.address || ""}
                            onChange={e => setTaxData({ ...taxData, address: e.target.value })}
                        />
                        <Input
                            label="Teléfono / Contacto (Para Recibo)"
                            value={taxData.contactPhone || ""}
                            onChange={e => setTaxData({ ...taxData, contactPhone: e.target.value })}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancelar</Button>
                    <Button type="submit" disabled={isLoading}>Guardar Cambios</Button>
                </div>
            </form>
        </div>
    );
}
