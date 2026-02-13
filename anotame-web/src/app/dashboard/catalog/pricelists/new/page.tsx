"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createPriceList } from "@/services/catalog/pricelists";
import { getServices } from "@/services/catalog/services";
import { ServiceResponse } from "@/types/dtos";

export default function NewPriceListPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [services, setServices] = useState<ServiceResponse[]>([]);

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
    }, []);

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
                        <CardTitle>Price Overrides</CardTitle>
                        <p className="text-sm text-muted-foreground">Leave empty to use Base Price.</p>
                    </CardHeader>
                    <CardContent>
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
