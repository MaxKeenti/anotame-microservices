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
  // Payment State
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [createdOrderTicket, setCreatedOrderTicket] = useState<string | null>(null);

  // ... (existing helper functions) ...

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + Number(item.price), 0);
  };

  const calculateBalance = () => {
    const total = calculateTotal();
    const paid = Number(amountPaid) || 0;
    return Math.max(0, total - paid);
  };

  // Ticket Printing Logic (Ported from Legacy)
  const handlePrint = () => {
    if (!createdOrderTicket) return;

    // TODO: formatting helper
    const formatDate = (d: string) => new Date(d).toLocaleDateString('es-ES');
    
    // Construct text receipt
    // In a real app, we might fetch the full order details again or use current state if it matches execution
    // For now, using current state as a proxy for the just-created order receipt
    let text = `
==================================
ENTREGA ->
FECHA: ${formatDate(deadline)}
----------------------------------
Datos personales ->
Nombre: ${firstName} ${lastName}
Tel: ${phone}
----------------------------------
Datos de la nota ->
Folio: ${createdOrderTicket}
Fecha: ${new Date().toLocaleDateString('es-ES')}
----------------------------------
PRENDAS:
`;

    items.forEach(item => {
        const g = garmentTypes.find(x => x.id === item.garmentId)?.name || "N/A";
        const s = services.find(x => x.id === item.serviceId)?.name || "N/A";
        text += `
Cant: 1
Prenda: ${g}
Servicio: ${s}
Nota: ${item.notes}
Precio: $${item.price}
--------------------
`;
    });

    text += `
====================
TOTAL: $${calculateTotal().toFixed(2)}
ANTICIPO: $${Number(amountPaid).toFixed(2)}
RESTANTE: $${calculateBalance().toFixed(2)}
====================
`;

    const newWindow = window.open('', '', 'width=400,height=600');
    if (newWindow) {
        newWindow.document.write(`<pre>${text}</pre>`);
        newWindow.document.close();
        newWindow.focus();
        newWindow.print();
        newWindow.close();
    }
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

    const payload: CreateOrderRequest & { amountPaid: number; paymentMethod: string } = {
        customer: {
            firstName,
            lastName,
            email,
            phone,
            address: "Walk-in"
        },
        items: orderItems,
        committedDeadline: deadline ? new Date(deadline).toISOString() : new Date().toISOString(),
        notes,
        amountPaid: Number(amountPaid),
        paymentMethod
    };

    try {
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
             setCreatedOrderTicket(order.ticketNumber || "Ticket-Unknown");
             alert(`Order Created! Ticket: ${order.ticketNumber}`);
             // Don't auto-push, allow print
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

  if (createdOrderTicket) {
      return (
          <div className="max-w-md mx-auto space-y-6 pt-10 text-center">
              <h1 className="text-3xl font-bold text-green-600">Order Created!</h1>
              <p className="text-xl">Ticket: {createdOrderTicket}</p>
              <div className="flex justify-center gap-4">
                  <Button size="lg" onClick={handlePrint}>Print Ticket</Button>
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ... (Existing JSX for Header) ... */}
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

        {/* Payment & Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Payment & Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-3 gap-4">
                 <Input 
                    label="Amount Paid" 
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountPaid} 
                    onChange={(e) => setAmountPaid(e.target.value)}
                 />
                 <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Payment Method</label>
                    <select 
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="TRANSFER">Transfer</option>
                    </select>
                 </div>
                 <div className="flex flex-col gap-2 justify-end pb-2">
                    <div className="text-sm font-bold">Balance Due:</div>
                    <div className={`text-xl ${calculateBalance() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${calculateBalance().toFixed(2)}
                    </div>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
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
            
            <div className="flex justify-end items-center gap-4 text-xl font-bold pt-4">
              <span>Total Order:</span>
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
