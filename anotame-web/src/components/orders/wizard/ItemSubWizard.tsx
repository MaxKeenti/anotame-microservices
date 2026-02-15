"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GarmentTypeResponse, ServiceResponse } from "@/types/dtos";
import { API_CATALOG } from "@/lib/api";
import { ArrowLeft, Check, CheckCircle2 } from "lucide-react";

interface SubWizardProps {
    initialItem?: any;
    onSave: (item: any) => void;
    onCancel: () => void;
}

export function ItemSubWizard({ initialItem, onSave, onCancel }: SubWizardProps) {
    const [step, setStep] = useState(initialItem ? 2 : 0); // 0=Garment, 1=Service, 2=Price, 3=Notes
    const [garmentTypes, setGarmentTypes] = useState<GarmentTypeResponse[]>([]);
    const [services, setServices] = useState<ServiceResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [selectedGarment, setSelectedGarment] = useState<GarmentTypeResponse | null>(null);
    const [selectedService, setSelectedService] = useState<ServiceResponse | null>(null);
    const [price, setPrice] = useState<string>("");
    const [adj, setAdj] = useState<string>("");
    const [adjReason, setAdjReason] = useState("");
    const [notes, setNotes] = useState("");

    // Load Catalog
    useEffect(() => {
        async function loadCatalog() {
            try {
                const [gRes, sRes] = await Promise.all([
                    fetch(`${API_CATALOG}/catalog/garments`),
                    fetch(`${API_CATALOG}/catalog/services`)
                ]);
                if (gRes.ok && sRes.ok) {
                    const gData = await gRes.json();
                    const sData = await sRes.json();
                    setGarmentTypes(gData);
                    setServices(sData);

                    // If editing, hydrate state
                    if (initialItem) {
                        const g = gData.find((x: GarmentTypeResponse) => x.id === initialItem.garmentId);
                        const s = sData.find((x: ServiceResponse) => x.id === initialItem.serviceId);
                        if (g) setSelectedGarment(g);
                        if (s) setSelectedService(s);
                        setPrice(String(initialItem.unitPrice));
                        setAdj(String(initialItem.adjustmentAmount || ""));
                        setAdjReason(initialItem.adjustmentReason || "");
                        setNotes(initialItem.notes || "");
                    }
                }
            } catch (e) {
                console.error("Failed to load catalog", e);
            } finally {
                setLoading(false);
            }
        }
        loadCatalog();
    }, [initialItem]);

    const [showAllServices, setShowAllServices] = useState(false);

    // Filter Services Logic
    const filteredServices = useMemo(() => {
        if (!selectedGarment) return [];

        // 1. Initial set: either all (if showAll) or strictly filtered by ID relationship
        let candidates = services;

        if (!showAllServices) {
            // Strict Filter: Database Relationship (Primary)
            const byId = services.filter(s => s.garmentTypeId === selectedGarment.id);

            // If we have matches by ID, use them.
            // This relies on the backend being updated and returning populated garmentTypeId.
            if (byId.length > 0) {
                candidates = byId;
            } else {
                // Fallback to Code/Name if ID not yet populated or no matches found (e.g. backend outdated)


                // If still empty, we might let the name-sorter do the work on the full list? 
                // No, better to show empty and let user click "Show All" or fallback to name filter.
                // Let's stick to the code/ID strictness requested.
                // If candidates is still 'services' (because byId was empty AND codeMatches was empty), 
                // we should probably default to Name Match filter to avoid showing everything unrelated.
                if (candidates === services) {
                    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const garmentName = normalize(selectedGarment.name);
                    const searchTerms = [garmentName];
                    if (garmentName.endsWith('es')) searchTerms.push(garmentName.slice(0, -2));
                    else if (garmentName.endsWith('s')) searchTerms.push(garmentName.slice(0, -1));

                    candidates = services.filter(s => {
                        const sName = normalize(s.name);
                        return searchTerms.some(term => sName.includes(term));
                    });
                }
            }
        }

        // 2. Sort the candidates by relevance (Name match)
        const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const garmentName = normalize(selectedGarment.name);
        const searchTerms = [garmentName];
        if (garmentName.endsWith('es')) searchTerms.push(garmentName.slice(0, -2));
        else if (garmentName.endsWith('s')) searchTerms.push(garmentName.slice(0, -1));

        return candidates.sort((a, b) => {
            const aName = normalize(a.name);
            const bName = normalize(b.name);

            const aMatch = searchTerms.some(term => aName.includes(term));
            const bMatch = searchTerms.some(term => bName.includes(term));

            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;

            return a.name.localeCompare(b.name);
        });
    }, [selectedGarment, services, showAllServices]);


    const handleGarmentSelect = (g: GarmentTypeResponse) => {
        setSelectedGarment(g);
        setSelectedService(null);
        setPrice("");
        setStep(1);
        setShowAllServices(false); // Reset on new garment
    };

    const handleServiceSelect = (s: ServiceResponse) => {
        setSelectedService(s);
        setPrice(String(s.basePrice));
        setStep(2);
    };

    const handleConfirm = () => {
        if (!selectedGarment || !selectedService) return;

        onSave({
            garmentId: selectedGarment.id,
            garmentName: selectedGarment.name,
            serviceId: selectedService.id,
            serviceName: selectedService.name,
            unitPrice: parseFloat(price) || 0,
            adjustmentAmount: parseFloat(adj) || 0,
            adjustmentReason: adjReason,
            notes: notes
        });
    };

    if (loading) return <div className="p-8 text-center">Cargando catálogo...</div>;

    return (
        <div className="flex flex-col h-full bg-background relative animate-in fade-in slide-in-from-right duration-300">
            <div className="flex items-center gap-4 border-b border-border pb-4 mb-4">
                {step > 0 && <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="px-2"><ArrowLeft className="w-6 h-6" /></Button>}
                <h3 className="text-xl font-bold truncate">
                    {step === 0 ? "Selecciona Prenda" :
                        step === 1 ? "Selecciona Servicio" :
                            step === 2 ? "Precio y Ajustes" : "Notas"}
                </h3>
                <Button variant="ghost" size="sm" onClick={onCancel} className="ml-auto text-destructive hover:bg-destructive/10">Cancelar</Button>
            </div>

            <div className="flex-1 overflow-y-auto px-1">
                {step === 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {garmentTypes.map(g => (
                            <button
                                key={g.id}
                                onClick={() => handleGarmentSelect(g)}
                                className="h-24 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all active:scale-95 shadow-sm"
                            >
                                <span className="font-bold text-lg lg:text-xl text-center px-2 wrap-break-word leading-tight">{g.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        {/* Toggle Show All */}
                        <div className="flex justify-end px-1">
                            <button
                                onClick={() => setShowAllServices(!showAllServices)}
                                className="text-sm text-primary underline hover:text-primary/80 transition-colors"
                            >
                                {showAllServices ? "Mostrar solo recomendados" : "Mostrar todos los servicios"}
                            </button>
                        </div>

                        {filteredServices.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
                                <div className="text-lg">No hay servicios recomendados para esta prenda.</div>
                                <Button variant="outline" onClick={() => setShowAllServices(true)} className="mt-2">
                                    Mostrar catálogo completo
                                </Button>
                                <Button variant="ghost" onClick={() => setStep(0)}>Volver a Prendas</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredServices.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => handleServiceSelect(s)}
                                        className="p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 flex items-center justify-between gap-4 transition-all active:scale-95 text-left shadow-sm min-h-[100px]"
                                    >
                                        <div className="flex-1">
                                            <div className="font-bold text-lg">{s.name}</div>
                                            <div className="text-sm text-muted-foreground line-clamp-2">{s.description}</div>
                                        </div>
                                        <div className="font-mono font-bold text-xl bg-secondary px-3 py-1 rounded">
                                            ${s.basePrice}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {step >= 2 && (
                    <div className="max-w-md mx-auto space-y-8 py-4 px-2">
                        {/* Summary Header */}
                        <div className="bg-secondary/30 p-4 rounded-xl flex items-center gap-4 border border-border">
                            <div className="w-14 h-14 bg-background rounded-full flex items-center justify-center text-3xl shadow-sm">👕</div>
                            <div className="overflow-hidden">
                                <div className="font-bold text-lg truncate">{selectedGarment?.name}</div>
                                <div className="text-muted-foreground truncate">{selectedService?.name}</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Precio Base ($)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xl">$</span>
                                <Input
                                    type="number"
                                    className="pl-10 h-16 text-3xl font-bold text-center"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Ajuste ($)</label>
                                <Input
                                    type="number"
                                    className="h-14 text-lg text-center"
                                    placeholder="+/- 0.00"
                                    value={adj}
                                    onChange={e => setAdj(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Razón Ajuste</label>
                                <Input
                                    className="h-14"
                                    placeholder="Difícil / Descuento"
                                    value={adjReason}
                                    onChange={e => setAdjReason(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notas de la Prenda</label>
                            <textarea
                                className="w-full min-h-[120px] rounded-xl border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                placeholder="Detalles específicos para el sastre..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {step >= 2 && (
                <div className="pt-4 border-t border-border mt-auto pb-4">
                    <Button size="lg" className="w-full h-16 text-xl rounded-xl shadow-lg" onClick={handleConfirm}>
                        <CheckCircle2 className="mr-2 w-6 h-6" />
                        Confirmar Prenda
                    </Button>
                </div>
            )}
        </div>
    );
}
