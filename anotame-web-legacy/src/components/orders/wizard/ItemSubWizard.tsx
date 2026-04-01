"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { GarmentTypeResponse, ServiceResponse } from "@/types/dtos";
import { API_CATALOG } from "@/lib/api";
import { ArrowLeft, CheckCircle2, Plus, Trash2, X } from "lucide-react";

interface SubWizardProps {
    initialItem?: any;
    onSave: (item: any) => void;
    onCancel: () => void;
}

interface AddedService {
    serviceId: string;
    serviceName: string;
    unitPrice: number;
    adjustmentAmount: number;
    adjustmentReason: string;
}

export function ItemSubWizard({ initialItem, onSave, onCancel }: SubWizardProps) {
    // Steps: 0=Garment, 1=Manage Services, 2=Configure Service, 3=Notes
    const [step, setStep] = useState(initialItem ? 1 : 0);
    const [garmentTypes, setGarmentTypes] = useState<GarmentTypeResponse[]>([]);
    const [services, setServices] = useState<ServiceResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [selectedGarment, setSelectedGarment] = useState<GarmentTypeResponse | null>(null);
    const [addedServices, setAddedServices] = useState<AddedService[]>([]);

    // Config Service State
    const [tempService, setTempService] = useState<ServiceResponse | null>(null);
    const [price, setPrice] = useState<string>("");
    const [adj, setAdj] = useState<string>("");
    const [adjReason, setAdjReason] = useState("");

    // Garment Notes
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
                        let g = gData.find((x: GarmentTypeResponse) => x.id === initialItem.garmentId || x.id === initialItem.garmentTypeId);
                        if (!g && initialItem.garmentName) {
                            g = gData.find((x: GarmentTypeResponse) => x.name.toLowerCase() === initialItem.garmentName.toLowerCase());
                        }
                        if (g) setSelectedGarment(g);

                        if (initialItem.services) {
                            setAddedServices(initialItem.services);
                        }
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

        let candidates = services;

        if (!showAllServices) {
            // Strict Filter: Database Relationship
            const byId = services.filter(s => s.garmentTypeId === selectedGarment.id);
            if (byId.length > 0) {
                candidates = byId;
            } else {
                // Name match fallback
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

        // Sort
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
        setAddedServices([]);
        setStep(1);
        setShowAllServices(false);
    };

    const handleServiceSelect = (s: ServiceResponse) => {
        setTempService(s);
        setPrice(String(s.effectivePrice ?? s.basePrice));
        setAdj("");
        setAdjReason("");
        setStep(2);
    };

    const handleAddService = () => {
        if (!tempService) return;

        const newService: AddedService = {
            serviceId: tempService.id,
            serviceName: tempService.name,
            unitPrice: parseFloat(price) || 0,
            adjustmentAmount: parseFloat(adj) || 0,
            adjustmentReason: adjReason
        };

        setAddedServices([...addedServices, newService]);
        setTempService(null);
        setStep(3); // Go to Notes/Review directly
    };

    const handleRemoveService = (index: number) => {
        const next = [...addedServices];
        next.splice(index, 1);
        setAddedServices(next);
    };

    const handleConfirmItem = () => {
        if (!selectedGarment) return;

        onSave({
            garmentId: selectedGarment.id,
            garmentName: selectedGarment.name,
            services: addedServices,
            notes: notes
        });
    };

    const handleNextToNotes = () => {
        setStep(3);
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Cargando catálogo...</div>;

    return (
        <div className="flex flex-col h-full bg-background relative animate-in fade-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border pb-4 mb-4">
                {step > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => {
                        if (step === 2) setStep(1);
                        else if (step === 3) setStep(1);
                        else if (step === 1) setStep(0);
                    }} className="px-2">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                )}
                <h3 className="text-xl font-bold truncate">
                    {step === 0 ? "Selecciona Prenda" :
                        step === 1 ? "Agregar Servicios" :
                            step === 2 ? "Configurar Servicio" : "Notas de la Prenda"}
                </h3>
                <Button variant="ghost" size="sm" onClick={onCancel} className="ml-auto text-destructive hover:bg-destructive/10">Cancelar</Button>
            </div>

            <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
                {/* STEP 0: Select Garment */}
                {step === 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {garmentTypes.map(g => (
                            <Button
                                key={g.id}
                                variant="outline"
                                onClick={() => handleGarmentSelect(g)}
                                className="h-24 flex flex-col items-center justify-center gap-1 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all shadow-sm whitespace-normal"
                            >
                                <span className="font-bold text-lg lg:text-xl text-center px-2 leading-tight w-full">{g.name}</span>
                            </Button>
                        ))}
                    </div>
                )}

                {/* STEP 1: Manage Services */}
                {step === 1 && selectedGarment && (
                    <div className="space-y-6">
                        {/* Selected Garment Header */}
                        <div className="bg-secondary/20 p-4 rounded-xl flex items-center gap-4 border border-border">
                            <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center text-2xl shadow-sm">👕</div>
                            <div className="font-bold text-xl">{selectedGarment.name}</div>
                        </div>

                        {/* Added Services List */}
                        {addedServices.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Servicios Agregados</h4>
                                {addedServices.map((s, idx) => (
                                    <div key={idx} className="bg-card border border-border p-3 rounded-lg flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
                                        <div>
                                            <div className="font-medium">{s.serviceName}</div>
                                            {s.adjustmentReason && <div className="text-xs text-muted-foreground">Adj: {s.adjustmentReason}</div>}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <div className="font-mono font-bold">${(s.unitPrice + s.adjustmentAmount).toFixed(2)}</div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveService(idx)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <div className="text-right font-bold pt-2 border-t text-lg">
                                    Total: ${addedServices.reduce((acc, s) => acc + s.unitPrice + s.adjustmentAmount, 0).toFixed(2)}
                                </div>
                            </div>
                        )}

                        {/* Add Services Section */}
                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Agregar Servicio</h4>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowAllServices(!showAllServices)}
                                    className="text-xs text-primary underline h-auto p-0 hover:bg-transparent"
                                >
                                    {showAllServices ? "Ver recomendados" : "Ver todos"}
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredServices.map(s => (
                                    <Button
                                        key={s.id}
                                        variant="outline"
                                        onClick={() => handleServiceSelect(s)}
                                        className="h-24 p-4 rounded-xl border-2 hover:border-primary hover:bg-primary/5 flex items-center justify-between gap-4 transition-all text-left bg-card shadow-sm w-full whitespace-normal"
                                    >
                                        <span className="font-bold text-sm lg:text-base leading-tight w-full line-clamp-2">{s.name}</span>
                                        <div className="flex flex-col items-end flex-shrink-0">
                                            {s.effectivePrice && s.effectivePrice !== s.basePrice && (
                                                <span className="text-xs text-muted-foreground line-through">${s.basePrice}</span>
                                            )}
                                            <span className="font-mono bg-secondary px-2 py-1 rounded text-sm font-bold text-primary">
                                                ${s.effectivePrice ?? s.basePrice}
                                            </span>
                                        </div>
                                    </Button>
                                ))}
                                {filteredServices.length === 0 && (
                                    <div className="col-span-full text-center py-8 text-muted-foreground">
                                        No hay servicios recomendados.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: Configure Service */}
                {step === 2 && tempService && (
                    <div className="max-w-md mx-auto space-y-6 py-4">
                        <div className="text-center space-y-1">
                            <h4 className="text-lg font-bold">{tempService.name}</h4>
                            <p className="text-sm text-muted-foreground">{tempService.description}</p>
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
                                    placeholder="Motivo..."
                                    value={adjReason}
                                    onChange={e => setAdjReason(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button size="lg" className="w-full h-14 text-lg mt-8" onClick={handleAddService}>
                            Confirmar Servicio
                        </Button>
                    </div>
                )}

                {/* STEP 3: Garment Notes */}
                {step === 3 && (
                    <div className="space-y-6 pt-4">
                        <div className="bg-secondary/20 p-4 rounded-xl border border-border">
                            <h4 className="font-bold text-lg mb-2">{selectedGarment?.name}</h4>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                {addedServices.map((s, i) => (
                                    <li key={i}>• {s.serviceName} (${(s.unitPrice + s.adjustmentAmount).toFixed(2)})</li>
                                ))}
                            </ul>
                            <div className="mt-3 pt-3 border-t border-dashed border-foreground/20 flex flex-col items-end gap-2">
                                <div className="font-bold text-lg">
                                    Total: ${addedServices.reduce((acc, s) => acc + s.unitPrice + s.adjustmentAmount, 0).toFixed(2)}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setStep(1)}
                                    className="text-xs"
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Agregar otro servicio
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notas Generales de la Prenda</label>
                            <Textarea
                                className="min-h-[150px] resize-none"
                                placeholder="Detalles específicos para el sastre sobre esta prenda..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            {step === 1 && (
                <div className="pt-4 border-t border-border mt-auto pb-4">
                    <Button
                        size="lg"
                        className="w-full h-14 text-lg shadow-md"
                        onClick={handleNextToNotes}
                        disabled={addedServices.length === 0}
                    >
                        Continuar
                    </Button>
                </div>
            )}

            {step === 3 && (
                <div className="pt-4 border-t border-border mt-auto pb-4">
                    <Button size="lg" className="w-full h-16 text-xl rounded-xl shadow-lg" onClick={handleConfirmItem}>
                        <CheckCircle2 className="mr-2 w-6 h-6" />
                        Confirmar Prenda
                    </Button>
                </div>
            )}
        </div>
    );
}
