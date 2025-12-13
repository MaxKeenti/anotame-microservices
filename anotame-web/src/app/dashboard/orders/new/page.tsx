"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { GarmentTypeResponse, ServiceResponse, CreateOrderRequest, OrderItemDto } from "@/types/dtos";
import { API_CATALOG, API_SALES } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function NewOrderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);

  // Catalog Data
  const [garmentTypes, setGarmentTypes] = useState<GarmentTypeResponse[]>([]);
  const [services, setServices] = useState<ServiceResponse[]>([]);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  
  const [items, setItems] = useState<Array<{
    tempId: number;
    garmentId: string;
    serviceId: string;
    notes: string;
    price: number;
  }>>([]);

  // Fetch Catalog Data on Mount
  useEffect(() => {
    async function fetchCatalog() {
      try {
        const [garmentRes, serviceRes] = await Promise.all([
          fetch(`${API_CATALOG}/catalog/garments`),
          fetch(`${API_CATALOG}/catalog/services`)
        ]);

        if (garmentRes.ok && serviceRes.ok) {
          setGarmentTypes(await garmentRes.json());
          setServices(await serviceRes.json());
        } else {
          console.error("Failed to fetch catalog data");
        }
      } catch (err) {
        console.error("Error connecting to catalog service", err);
      } finally {
        setIsCatalogLoading(false);
      }
    }
    fetchCatalog();
  }, []);

  const addItem = () => {
    // Default to first available options if loaded
    const defaultGarment = garmentTypes[0]?.id || "";
    const defaultService = services[0]?.id || "";
    const defaultPrice = services[0]?.basePrice || 0;

    setItems([
      ...items, 
      { 
        tempId: Date.now(), 
        garmentId: defaultGarment, 
        serviceId: defaultService, 
        notes: "",
        price: defaultPrice
      }
    ]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(i => i.tempId !== id));
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.tempId === id) {
        const updated = { ...item, [field]: value };
        // Update price if service changes
        if (field === 'serviceId') {
          const service = services.find(s => s.id === value);
          if (service) updated.price = service.basePrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + Number(item.price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Please add at least one item.");
      return;
    }
    setIsLoading(true);

    const orderItems: OrderItemDto[] = items.map(item => {
        const g = garmentTypes.find(g => g.id === item.garmentId);
        const s = services.find(s => s.id === item.serviceId);
        return {
            garmentTypeId: item.garmentId,
            garmentName: g?.name || "Unknown",
            serviceId: item.serviceId,
            serviceName: s?.name || "Unknown",
            unitPrice: item.price,
            quantity: 1,
            notes: item.notes
        };
    });

    const payload: CreateOrderRequest = {
        customer: {
            firstName,
            lastName,
            email,
            phone,
            address: "Walk-in" // Default for now
        },
        items: orderItems,
        committedDeadline: deadline ? new Date(deadline).toISOString() : new Date().toISOString(),
        notes
    };

    try {
        const res = await fetch(`${API_SALES}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
             const order = await res.json();
             alert(`Order Created! Ticket: ${order.ticketNumber || 'PENDING'}`);
             router.push("/dashboard");
        } else {
             alert("Failed to create order");
        }
    } catch (err) {
        console.error("Submit error", err);
        alert("Error submitting order");
    } finally {
        setIsLoading(false);
    }
  };

  if (isCatalogLoading) {
    return <div className="p-8 text-center">Loading catalog options...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-foreground">New Order</h1>
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Input label="First Name" placeholder="Jane" required value={firstName} onChange={e => setFirstName(e.target.value)} />
            <Input label="Last Name" placeholder="Doe" required value={lastName} onChange={e => setLastName(e.target.value)} />
            <Input label="Phone" placeholder="555-0123" required value={phone} onChange={e => setPhone(e.target.value)} />
            <Input label="Email" type="email" placeholder="jane@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Garments & Services</CardTitle>
            <Button type="button" size="sm" onClick={addItem}>+ Add Item</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No items added. Click "Add Item" to start.
              </p>
            )}
            
            {items.map((item) => (
              <div key={item.tempId} className="grid grid-cols-12 gap-4 items-start p-4 border border-border rounded-lg bg-secondary/10">
                <div className="col-span-3">
                  <label className="text-xs font-medium mb-1 block">Garment</label>
                  <select 
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={item.garmentId}
                    onChange={(e) => updateItem(item.tempId, 'garmentId', e.target.value)}
                  >
                    {garmentTypes.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="text-xs font-medium mb-1 block">Service</label>
                  <select 
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={item.serviceId}
                    onChange={(e) => updateItem(item.tempId, 'serviceId', e.target.value)}
                  >
                     {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name} (${s.basePrice})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-5">
                   <Input 
                    label="Notes" 
                    placeholder="e.g. Hem 1 inch" 
                    value={item.notes} 
                    onChange={(e) => updateItem(item.tempId, 'notes', e.target.value)}
                   />
                </div>
                <div className="col-span-1 pt-6 flex justify-end">
                  <button type="button" onClick={() => removeItem(item.tempId)} className="text-red-500 hover:text-red-700">
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                 <Input 
                    label="Deadline" 
                    type="date"
                    value={deadline} 
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                   />
                 <Input 
                    label="Internal Notes" 
                    placeholder="Urgent..." 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                   />
            </div>
            
            <div className="flex justify-end items-center gap-4 text-xl font-bold pt-4 border-t border-border">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button size="lg" disabled={isLoading || items.length === 0}>
            {isLoading ? "Creating Ticket..." : "Create Ticket"}
          </Button>
        </div>
      </form>
    </div>
  );
}
