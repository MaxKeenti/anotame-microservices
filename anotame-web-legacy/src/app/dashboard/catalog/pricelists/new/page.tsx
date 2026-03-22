"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createPriceList, getPriceLists, getPriceList } from "@/services/catalog/pricelists";
import { getServices } from "@/services/catalog/services";
import { ServiceResponse, PriceListResponse } from "@/types/dtos";

export default function NewPriceListPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [services, setServices] = useState<ServiceResponse[]>([]);

    // Base List State
    const [availableLists, setAvailableLists] = useState<PriceListResponse[]>([]);
    const [baseListId, setBaseListId] = useState<string>("");

    // Form State
    const [name, setName] = useState("");
    const [priority, setPriority] = useState(0);
    const [validFrom, setValidFrom] = useState(new Date().toISOString().split('T')[0]);
    const [validTo, setValidTo] = useState("");
    const [active, setActive] = useState(true);

    // Overrides: Map of ServiceID -> Price
    const [overrides, setOverrides] = useState<Record<string, string>>({});

    useEffect(() => {
        getServices().then(setServices).catch(console.error);
        getPriceLists().then(setAvailableLists).catch(console.error);
    }, []);

    const handleBaseListChange = async (listId: string) => {
        setBaseListId(listId);
        if (!listId) return;

        try {
            setIsLoading(true);
            const list = await getPriceList(listId);
            if (list.items) {
                const newOverrides: Record<string, string> = {};
                list.items.forEach(item => {
                    newOverrides[item.serviceId] = String(item.price);
                });
                setOverrides(newOverrides);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to load base price list");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkAdjustment = (amount: number) => {
        setOverrides(prev => {
            const next = { ...prev };
            services.forEach(service => {
                const currentPrice = parseFloat(next[service.id] || String(service.basePrice));
                const newPrice = Math.max(0, currentPrice + amount);
                next[service.id] = newPrice.toFixed(2);
            });
            return next;
        });
    };

    const handleReset = () => {
        if (baseListId) {
            handleBaseListChange(baseListId);
        } else {
            setOverrides({});
        }
    };

    const handleOverrideChange = (serviceId: string, val: string) => {
        setOverrides(prev => ({ ...prev, [serviceId]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Filter out empty overrides
            const items = Object.entries(overrides)
                .filter(([key, val]) => val && val.trim() !== "")
                .map(([serviceId, val]) => ({
                    serviceId,
                    price: parseFloat(val)
                }));

            await createPriceList({
                name,
                priority,
                validFrom: new Date(validFrom).toISOString(),
                validTo: validTo ? new Date(validTo).toISOString() : undefined,
                active,
                items
            });

            router.push("/dashboard/catalog/pricelists");
        } catch (err) {
            console.error(err);
            alert("Failed to create price list");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">New Price List</h1>
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Strategy Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input label="Name" placeholder="e.g. Winter Sale 2025" required value={name} onChange={e => setName(e.target.value)} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Priority (Higher wins)" type="number" required value={priority} onChange={e => setPriority(parseInt(e.target.value))} />
                            <div className="flex items-center gap-2 pt-8">
                                <input type="checkbox" className="w-5 h-5" checked={active} onChange={e => setActive(e.target.checked)} />
                                <label>Is Active</label>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DatePicker
                                label="Valid From"
                                value={validFrom}
                                onChange={date => setValidFrom(date.toISOString().split('T')[0])}
                            />
                            <DatePicker
                                label="Valid To (Optional)"
                                value={validTo}
                                onChange={date => setValidTo(date.toISOString().split('T')[0])}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Base Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Copy from existing list</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={baseListId}
                                onChange={(e) => handleBaseListChange(e.target.value)}
                                disabled={isLoading}
                            >
                                <option value="">-- Start from scratch (Base Prices) --</option>
                                {availableLists.map(list => (
                                    <option key={list.id} value={list.id}>{list.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground">Selecting a list will overwrite current overrides with prices from that list.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Price Overrides</CardTitle>
                        <p className="text-sm text-muted-foreground">Leave empty to use Base Price.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2 items-center p-4 bg-secondary/10 rounded-lg border border-border">
                            <span className="text-sm font-medium mr-2">Bulk Adjust:</span>
                            {[5, 10, 15, 20].map(amount => (
                                <Button key={`plus-${amount}`} type="button" variant="outline" size="sm" onClick={() => handleBulkAdjustment(amount)} className="text-success hover:text-success/90 hover:bg-success-muted border-success/30">
                                    + ${amount}
                                </Button>
                            ))}
                            <div className="w-px h-6 bg-border mx-2" />
                            {[5, 10, 15, 20].map(amount => (
                                <Button key={`minus-${amount}`} type="button" variant="outline" size="sm" onClick={() => handleBulkAdjustment(-amount)} className="text-destructive hover:text-destructive/90 hover:bg-destructive-muted border-destructive/30">
                                    - ${amount}
                                </Button>
                            ))}
                            <div className="w-px h-6 bg-border mx-2" />
                            <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
                                Reset
                            </Button>
                        </div>

                        <div className="border rounded-md">
                            <table className="w-full text-sm">
                                <thead className="bg-secondary/20">
                                    <tr>
                                        <th className="p-3 text-left">Service</th>
                                        <th className="p-3 text-left">Base Price</th>
                                        <th className="p-3 text-left">Override Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {services.map(service => (
                                        <tr key={service.id} className="border-t hover:bg-secondary/5">
                                            <td className="p-3 font-medium">{service.name}</td>
                                            <td className="p-3 text-muted-foreground">${service.basePrice.toFixed(2)}</td>
                                            <td className="p-3">
                                                <Input
                                                    placeholder="e.g. 100.00"
                                                    type="number"
                                                    step="0.01"
                                                    value={overrides[service.id] || ""}
                                                    onChange={e => handleOverrideChange(service.id, e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="submit" disabled={isLoading} size="lg">
                        {isLoading ? "Creating..." : "Create Price List"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
