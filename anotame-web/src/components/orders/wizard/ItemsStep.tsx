"use client";

import { useMemo, useState } from "react";
import { DraftOrder } from "@/services/local/DraftsService";
import { ItemSubWizard } from "./ItemSubWizard";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, Edit } from "lucide-react";

interface StepProps {
    draft: DraftOrder;
    updateDraft: (updates: Partial<DraftOrder>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function ItemsStep({ draft, updateDraft, onNext, onBack }: StepProps) {
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const handleSaveItem = (item: any) => {
        const newItems = [...(draft.items || [])];
        if (editingIndex !== null) {
            newItems[editingIndex] = item;
        } else {
            newItems.push(item);
        }
        updateDraft({ items: newItems });
        setIsAddingItem(false);
        setEditingIndex(null);
    };

    const handleEditItem = (index: number) => {
        setEditingIndex(index);
        setIsAddingItem(true);
    };

    const handleDeleteItem = (index: number) => {
        const newItems = [...(draft.items || [])];
        newItems.splice(index, 1);
        updateDraft({ items: newItems });
    };

    const total = useMemo(() => {
        return (draft.items || []).reduce((acc, item) => {
            const servicesTotal = (item.services || []).reduce((sAcc, s) => sAcc + s.unitPrice + (s.adjustmentAmount || 0), 0);
            return acc + servicesTotal;
        }, 0);
    }, [draft.items]);

    if (isAddingItem) {
        return (
            <ItemSubWizard
                initialItem={editingIndex !== null ? draft.items![editingIndex] : undefined}
                onSave={handleSaveItem}
                onCancel={() => {
                    setIsAddingItem(false);
                    setEditingIndex(null);
                }}
            />
        );
    }

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Paso 2: Prendas y Servicios</h2>
                    <p className="text-muted-foreground">Agrega las prendas que el cliente deja.</p>
                </div>
                <Button onClick={() => setIsAddingItem(true)} size="lg" className="rounded-full h-12 px-6">
                    <Plus className="w-5 h-5 mr-2" />
                    Agregar Prenda
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {(!draft.items || draft.items.length === 0) ? (
                    <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-xl text-muted-foreground">
                        <p>No hay prendas agregadas.</p>
                        <div
                            className="mt-4 text-primary font-medium cursor-pointer hover:underline"
                            onClick={() => setIsAddingItem(true)}
                        >
                            + Agregar la primera prenda
                        </div>
                    </div>
                ) : (
                    draft.items.map((item, idx) => (
                        <div key={idx} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex-1">
                                <div className="font-bold text-lg">{item.garmentName}</div>
                                <div className="text-sm text-muted-foreground">
                                    {item.services?.map((s, i) => (
                                        <div key={i} className="flex gap-2">
                                            <span>• {s.serviceName}</span>
                                            <span className="font-mono text-xs">
                                                ${(s.unitPrice + (s.adjustmentAmount || 0)).toFixed(2)}
                                                {s.adjustmentAmount ? ` (Adj: ${s.adjustmentAmount})` : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {item.notes && (
                                    <div className="text-xs text-muted-foreground mt-1 bg-secondary/50 p-1 rounded inline-block">
                                        Nota: {item.notes}
                                    </div>
                                )}
                            </div>
                            <div className="text-right px-4">
                                <div className="font-mono font-bold text-lg">
                                    ${(item.services || []).reduce((acc, s) => acc + s.unitPrice + (s.adjustmentAmount || 0), 0).toFixed(2)}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditItem(idx)}>
                                    <Edit className="w-5 h-5 text-muted-foreground hover:text-primary" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(idx)}>
                                    <Trash2 className="w-5 h-5 text-muted-foreground hover:text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="border-t border-border pt-4 mt-auto">
                <div className="flex justify-between items-center mb-4 px-2">
                    <span className="text-lg font-medium">Total Estimado:</span>
                    <span className="text-2xl font-bold">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <Button variant="outline" size="lg" onClick={onBack} className="flex-1">Atrás</Button>
                    <Button size="lg" onClick={onNext} disabled={!draft.items || draft.items.length === 0} className="flex-1">
                        Continuar al Pago
                    </Button>
                </div>
            </div>
        </div>
    );
}
