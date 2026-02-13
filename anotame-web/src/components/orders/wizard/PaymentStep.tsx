"use client";

import { useMemo, useState } from "react";
import { DraftOrder } from "@/services/local/DraftsService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { CreditCard, DollarSign, Wallet } from "lucide-react";
import { CreateOrderRequest, OrderItemDto } from "@/types/dtos";
import { API_SALES } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface StepProps {
    draft: DraftOrder;
    updateDraft: (updates: Partial<DraftOrder>) => void;
    onNext: () => void; // Not used here, this is final step
    onBack: () => void;
}

export function PaymentStep({ draft, updateDraft, onBack }: StepProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const total = useMemo(() => {
        return (draft.items || []).reduce((acc, item) => acc + item.unitPrice + (item.adjustmentAmount || 0), 0);
    }, [draft.items]);

    const balance = Math.max(0, total - (draft.amountPaid || 0));

    const handlePaymentMethod = (method: string) => {
        updateDraft({ paymentMethod: method });
    };

    const handleAmountPaid = (amount: string) => {
        const val = parseFloat(amount);
        updateDraft({ amountPaid: isNaN(val) ? 0 : val });
    };

    const handleDeadline = (date: string) => {
        updateDraft({ committedDeadline: date });
    };

    const handleNotes = (notes: string) => {
        updateDraft({ notes });
    };

    const handleSubmit = async () => {
        if (!draft.customer || !draft.items || draft.items.length === 0) {
            setError("Faltan datos requeridos (Cliente o Prendas)");
            return;
        }
        setError(null);
        setIsSubmitting(true);

        try {
            const orderItems: OrderItemDto[] = draft.items.map(item => ({
                garmentTypeId: item.garmentTypeId || item.garmentId || "", // Handle both just in case
                garmentName: item.garmentName || "",
                serviceId: item.serviceId || "",
                serviceName: item.serviceName || "",
                unitPrice: item.unitPrice,
                quantity: 1,
                notes: item.notes || "",
                adjustmentAmount: item.adjustmentAmount,
                adjustmentReason: item.adjustmentReason
            }));

            // Format deadline to LocalDateTime (YYYY-MM-DDTHH:mm:ss)
            let deadlineStr = draft.committedDeadline;
            if (!deadlineStr) {
                deadlineStr = new Date().toISOString().slice(0, 19);
            } else if (deadlineStr.length === 10) {
                // Is just YYYY-MM-DD, append time
                deadlineStr = `${deadlineStr}T18:00:00`;
            } else {
                // Ensure we don't send Z or offsets if backend is strict about LocalDateTime
                deadlineStr = deadlineStr.slice(0, 19);
            }

            const payload: CreateOrderRequest & { amountPaid: number; paymentMethod: string } = {
                customer: draft.customer,
                items: orderItems,
                committedDeadline: deadlineStr,
                notes: draft.notes || "",
                amountPaid: draft.amountPaid || 0,
                paymentMethod: draft.paymentMethod || "CASH"
            };

            const res = await fetch(`${API_SALES}/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-Name": user?.username || "Anonymous",
                    "X-User-Id": user?.id || "unknown",
                    "X-User-Role": user?.role || "USER"
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const order = await res.json();
                // Clear draft
                const { DraftsService } = await import("@/services/local/DraftsService");
                DraftsService.delete(draft.id);

                // Redirect to success/print page or dashboard
                // For now back to dashboard with alert (or success page)
                // Redirect to order details with print action
                router.push(`/dashboard/orders/${order.id}?action=print`);
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(`Error al crear orden: ${errData.message || res.statusText}`);
            }
        } catch (e) {
            console.error(e);
            setError("Error de conexión al servidor");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Paso 3: Pago y Confirmación</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                {/* Total Section */}
                <div className="text-center py-6 bg-muted/20 rounded-xl">
                    <div className="text-muted-foreground uppercase text-sm font-semibold tracking-wider">Total a Pagar</div>
                    <div className="text-5xl font-bold font-mono mt-2">${total.toFixed(2)}</div>
                </div>

                {/* Payment Method */}
                <div className="space-y-4">
                    <label className="text-sm font-medium">Método de Pago</label>
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            onClick={() => handlePaymentMethod("CASH")}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${draft.paymentMethod === 'CASH' ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}
                        >
                            <DollarSign className="w-8 h-8 mb-2" />
                            <span className="font-semibold">Efectivo</span>
                        </button>
                        <button
                            onClick={() => handlePaymentMethod("CARD")}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${draft.paymentMethod === 'CARD' ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}
                        >
                            <CreditCard className="w-8 h-8 mb-2" />
                            <span className="font-semibold">Tarjeta</span>
                        </button>
                        <button
                            onClick={() => handlePaymentMethod("TRANSFER")}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${draft.paymentMethod === 'TRANSFER' ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}
                        >
                            <Wallet className="w-8 h-8 mb-2" />
                            <span className="font-semibold">Transferencia</span>
                        </button>
                    </div>
                </div>

                {/* Payment Amounts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Monto Recibido</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="pl-8 text-lg h-12"
                                value={draft.amountPaid || ""}
                                onChange={(e) => handleAmountPaid(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        {/* Quick Buttons */}
                        <div className="flex gap-2 mt-2">
                            <Button variant="outline" size="sm" onClick={() => updateDraft({ amountPaid: total })}>Total</Button>
                            <Button variant="outline" size="sm" onClick={() => updateDraft({ amountPaid: total / 2 })}>50%</Button>
                            <Button variant="outline" size="sm" onClick={() => updateDraft({ amountPaid: 0 })}>0</Button>
                        </div>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl flex flex-col justify-center items-center">
                        <div className="text-sm text-muted-foreground">Saldo Pendiente</div>
                        <div className={`text-3xl font-bold mt-1 ${balance > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                            ${balance.toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Deadline & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Fecha de Entrega</label>
                        <DatePicker
                            value={draft.committedDeadline}
                            onChange={(date) => handleDeadline(date.toISOString())}
                            className="w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Notas Generales</label>
                        <Input
                            placeholder="Urgente, llamar antes, etc."
                            className="h-12"
                            value={draft.notes || ""}
                            onChange={(e) => handleNotes(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-center text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="border-t border-border pt-4 mt-auto flex justify-between gap-4">
                <Button variant="outline" size="lg" onClick={onBack} className="flex-1" disabled={isSubmitting}>
                    Atrás
                </Button>
                <Button size="lg" onClick={handleSubmit} disabled={isSubmitting} className="flex-1 text-lg">
                    {isSubmitting ? "Procesando..." : "Confirmar Orden"}
                </Button>
            </div>
        </div>
    );
}
