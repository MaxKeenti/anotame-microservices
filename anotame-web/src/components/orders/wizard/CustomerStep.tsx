"use client";

import { useState, useEffect } from "react";
import { DraftOrder } from "@/services/local/DraftsService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { searchCustomers } from "@/services/sales/customers";
import { CustomerDto } from "@/types/dtos";
import { Plus, Search, User } from "lucide-react";
import Link from "next/link";

interface StepProps {
    draft: DraftOrder;
    updateDraft: (updates: Partial<DraftOrder>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function CustomerStep({ draft, updateDraft, onNext, onBack }: StepProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<CustomerDto[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length > 2) {
                setIsSearching(true);
                try {
                    const res = await searchCustomers(query);
                    setResults(res);
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const selectCustomer = (c: CustomerDto) => {
        updateDraft({
            customer: c
        });
        setQuery("");
        setResults([]);
    };

    const clearCustomer = () => {
        updateDraft({ customer: undefined });
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="text-center md:text-left">
                <h2 className="text-xl font-semibold">Paso 1: ¿De quién es el pedido?</h2>
                <p className="text-muted-foreground">Busca un cliente existente o crea uno nuevo.</p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-start max-w-2xl mx-auto w-full gap-8 pt-4">

                {/* Selected Customer Card */}
                {draft.customer ? (
                    <div className="w-full bg-primary/5 border border-primary/20 rounded-xl p-6 text-center animate-in fade-in zoom-in-95">
                        <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold">{draft.customer.firstName} {draft.customer.lastName}</h3>
                        <p className="text-muted-foreground">{draft.customer.phoneNumber}</p>
                        <p className="text-muted-foreground text-sm">{draft.customer.email}</p>

                        <div className="mt-6 flex justify-center gap-4">
                            <Button variant="outline" onClick={clearCustomer}>Cambiar Cliente</Button>
                            <Button size="lg" onClick={onNext} className="w-32">Continuar</Button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full space-y-6">
                        {/* Search Box */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6" />
                            <Input
                                placeholder="Buscar por nombre o teléfono..."
                                className="pl-12 h-16 text-lg rounded-xl shadow-sm"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                            {/* Results Dropdown */}
                            {results.length > 0 && (
                                <div className="absolute top-FULL left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-20 max-h-80 overflow-y-auto">
                                    {results.map(c => (
                                        <button
                                            key={c.id}
                                            className="w-full text-left p-4 hover:bg-secondary border-b border-border last:border-0 flex items-center justify-between group transition-colors"
                                            onClick={() => selectCustomer(c)}
                                        >
                                            <div>
                                                <div className="font-bold text-lg group-hover:text-primary">{c.firstName} {c.lastName}</div>
                                                <div className="text-sm text-muted-foreground">{c.phoneNumber}</div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 text-primary">Seleccionar &rarr;</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="text-center text-muted-foreground py-4">- O -</div>

                        {/* New Customer Button */}
                        <Link href="/dashboard/customers/new">
                            <Button variant="secondary" className="w-full h-16 text-lg rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 gap-2">
                                <Plus className="w-6 h-6" />
                                Registrar Nuevo Cliente
                            </Button>
                        </Link>
                    </div>
                )}

            </div>

            {!draft.customer && (
                <div className="flex justify-between items-center py-4 border-t border-border mt-auto">
                    <Button variant="ghost" onClick={onBack}>Cancelar</Button>
                    <Button disabled>Selecciona un Cliente</Button>
                </div>
            )}
        </div>
    );
}
