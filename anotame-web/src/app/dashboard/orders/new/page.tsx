"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { GarmentTypeResponse, ServiceResponse, CreateOrderRequest, OrderItemDto, CustomerDto } from "@/types/dtos";
import { API_CATALOG, API_SALES } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { searchCustomers } from "@/services/sales/customers";
import { getSettings } from "@/services/operations/establishment";
import { Establishment } from "@/types/dtos";



export default function NewOrderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);

  // Catalog & Settings Data
  const [garmentTypes, setGarmentTypes] = useState<GarmentTypeResponse[]>([]);
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerDto[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");

  // Search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        const results = await searchCustomers(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // If user clears, maybe reset specific customer connection?
    // For now simplistic: just search.
    if (query.length === 0) {
      setCustomerId(undefined);
    }
  };

  const selectCustomer = (c: CustomerDto) => {
    setCustomerId(c.id);
    setFirstName(c.firstName);
    setLastName(c.lastName);
    setPhone(c.phoneNumber); // Update mapping from dto
    setEmail(c.email);
    setSearchQuery(""); // Clear search to hide results
    setSearchResults([]);
  };

  const [items, setItems] = useState<Array<{
    tempId: number;
    garmentId: string;
    serviceId: string;
    notes: string;
    price: number;
    adj?: number;
    adjReason?: string;
  }>>([]);

  // Fetch Catalog Data on Mount
  useEffect(() => {
    async function fetchCatalog() {
      try {
        const [garmentRes, serviceRes] = await Promise.all([
          fetch(`${API_CATALOG}/catalog/garments`),
          fetch(`${API_CATALOG}/catalog/services`)
        ]);

        try {
          const settings = await getSettings();
          setEstablishment(settings);
        } catch (e) { console.warn("Could not load receipt settings"); }

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

  // Filtering Logic
  const getFilteredServices = (garmentId: string) => {
    const garment = garmentTypes.find(g => g.id === garmentId);
    if (!garment) return services; // Fallback

    let prefix = "";
    // Map Garment Code to Service Prefix
    switch (garment.code) {
      case "GT-PANT": prefix = "SRV-PANT"; break;
      case "GT-BLUSA": prefix = "SRV-BLU"; break;
      case "GT-FALDA": prefix = "SRV-FAL"; break;
      case "GT-SACO": prefix = "SRV-SACO"; break;
      case "GT-VAR": prefix = "SRV-VAR"; break;
      default: return services; // Show all if unknown
    }

    return services.filter(s => s.code.startsWith(prefix));
  };

  const addItem = () => {
    // Default to first available options if loaded
    const defaultGarment = garmentTypes[0]?.id || "";

    // Filter services for default garment
    const availableServices = getFilteredServices(defaultGarment);
    const defaultService = availableServices[0]?.id || "";
    const defaultPrice = availableServices[0]?.basePrice || 0;

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

  const updateItem = async (id: number, field: string, value: any) => {
    const updatedItems = [...items];
    const index = updatedItems.findIndex(i => i.tempId === id);
    if (index === -1) return;

    // Constraint: Validations
    let finalValue = value;
    if (field === 'adj' || field === 'price') {
      finalValue = value === "" ? 0 : parseFloat(value);
    }

    const item = { ...updatedItems[index], [field]: finalValue };

    // Handling Garment Change -> Reset Service
    if (field === 'garmentId') {
      item.garmentId = value; // Set new garment
      const availableServices = getFilteredServices(value);
      // Reset service to first available
      if (availableServices.length > 0) {
        item.serviceId = availableServices[0].id;
        item.price = availableServices[0].basePrice;
      } else {
        item.serviceId = "";
        item.price = 0;
      }
    }

    // Auto-calculate price if Service changes (or was reset above, but usually explicit change)
    if (field === 'serviceId') {
      try {
        // Find locally first to be snappy
        const s = services.find(x => x.id === value);
        if (s) item.price = s.basePrice;

        // Optionally Call Pricing Service for dynamic rules (skipping for now to rely on catalog base)
      } catch (e) {
        console.error("Pricing calc failed", e);
      }
    }

    updatedItems[index] = item;
    setItems(updatedItems);
  };
  // Payment State
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [createdOrderTicket, setCreatedOrderTicket] = useState<string | null>(null);

  // ... (existing helper functions) ...

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + Number(item.price) + (Number(item.adj) || 0), 0);
  };

  const calculateBalance = () => {
    const total = calculateTotal();
    const paid = Number(amountPaid) || 0;
    return Math.max(0, total - paid);
  };

  // Ticket Printing Logic
  const handlePrint = async () => {
    if (!createdOrderTicket) return;

    // Dynamic import to avoid SSR issues if used elsewhere, though here it's client comp
    const { generateReceiptHtml } = await import("@/utils/receipt-generator");

    const receiptHtml = generateReceiptHtml({
      ticketNumber: createdOrderTicket,
      customerName: `${firstName} ${lastName}`,
      phone: phone,
      deadline: deadline || new Date().toISOString(),
      items: items.map(i => {
        const g = garmentTypes.find(x => x.id === i.garmentId)?.name || "N/A";
        const s = services.find(x => x.id === i.serviceId)?.name || "N/A";
        return {
          garment: g,
          service: s,
          notes: i.notes,
          price: Number(i.price),
          adjustment: i.adj ? Number(i.adj) : undefined,
          adjustmentReason: i.adjReason
        };
      }),
      total: calculateTotal(),
      amountPaid: Number(amountPaid) || 0,
      balance: calculateBalance(),
      establishment: {
        name: establishment?.name || "ANOTAME Default",
        address: establishment?.taxInfo ? JSON.parse(establishment.taxInfo).address : undefined,
        rfc: establishment?.taxInfo ? JSON.parse(establishment.taxInfo).rfc : undefined
      }
    });

    const newWindow = window.open('', '_blank', 'width=400,height=600');
    if (newWindow) {
      newWindow.document.write(receiptHtml);
      newWindow.document.close();

      // Wait for images/styles to load (if any)
      newWindow.setTimeout(() => {
        newWindow.focus();
        newWindow.print();
        newWindow.close();
      }, 250);
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
        notes: item.notes,
        adjustmentAmount: Number(item.adj || 0),
        adjustmentReason: item.adjReason
      };
    });

    const payload: CreateOrderRequest & { amountPaid: number; paymentMethod: string } = {
      customer: {
        id: customerId,
        firstName,
        lastName,
        email,
        phoneNumber: phone,
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
      <div className="max-w-md mx-auto pt-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-green-600 text-3xl">¡Pedido Creado!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-xl">Ticket: <span className="font-mono font-bold">{createdOrderTicket}</span></p>
            <div className="flex justify-center gap-4">
              <Button size="lg" onClick={handlePrint}>Imprimir Ticket</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard")}>Ir al Inicio</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-foreground">Nuevo Pedido</h1>
        <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="flex gap-2 items-end">
              <div className="relative flex-1">
                <Input
                  label="Buscar Cliente (Nombre/Tel)"
                  placeholder="Escribe para buscar..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-background border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {searchResults.map(c => (
                      <div
                        key={c.id}
                        className="p-2 hover:bg-secondary cursor-pointer"
                        onClick={() => selectCustomer(c)}
                      >
                        <div className="font-bold">{c.firstName} {c.lastName}</div>
                        <div className="text-xs text-muted-foreground">{c.phoneNumber} | {c.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button type="button" onClick={() => router.push("/dashboard/customers/new")}>
                + Nuevo Cliente
              </Button>
            </div>


            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombre" placeholder="Juan" required value={firstName} onChange={e => setFirstName(e.target.value)} />
              <Input label="Apellido" placeholder="Pérez" required value={lastName} onChange={e => setLastName(e.target.value)} />
              <Input label="Teléfono" placeholder="555-0123" required value={phone} onChange={e => setPhone(e.target.value)} />
              <Input label="Correo" type="email" placeholder="juan@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Prendas y Servicios</CardTitle>
            <Button type="button" size="sm" onClick={addItem}>+ Agregar Prenda</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay prendas. Clic en "+ Agregar Prenda" para iniciar.
              </p>
            )}

            {items.map((item) => (
              <div key={item.tempId} className="grid grid-cols-12 gap-4 items-start p-4 border border-border rounded-lg bg-secondary/10">
                <div className="col-span-3">
                  <label className="text-xs font-medium mb-1 block">Prenda</label>
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
                  <label className="text-xs font-medium mb-1 block">Servicio</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={item.serviceId}
                    onChange={(e) => updateItem(item.tempId, 'serviceId', e.target.value)}
                  >
                    {getFilteredServices(item.garmentId).map(s => (
                      <option key={s.id} value={s.id}>{s.name} (${s.basePrice})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <Input
                    label="Notas"
                    placeholder="ej. Bastilla 1 pulgada"
                    value={item.notes}
                    onChange={(e) => updateItem(item.tempId, 'notes', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium mb-1 block">Ajustar Precio ($)</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      className="w-20 h-10 rounded-md border border-input px-2 text-sm"
                      placeholder="+/- 0"
                      value={item.adj || ""}
                      onChange={(e) => updateItem(item.tempId, 'adj', e.target.value)}
                    />
                    <input
                      type="text"
                      className="w-full h-10 rounded-md border border-input px-2 text-sm"
                      placeholder="Razón"
                      value={item.adjReason || ""}
                      onChange={(e) => updateItem(item.tempId, 'adjReason', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-span-1 pt-6 flex justify-end gap-2">
                  <button type="button" onClick={() => {
                    setItems([...items, { ...item, tempId: Date.now() }]);
                  }} className="text-blue-500 hover:text-blue-700" title="Duplicar">
                    📋
                  </button>
                  <button type="button" onClick={() => removeItem(item.tempId)} className="text-red-500 hover:text-red-700" title="Eliminar">
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
            <CardTitle>Pago y Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Monto Pagado"
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Método de Pago</label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="TRANSFER">Transferencia</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 justify-end pb-2">
                <div className="text-sm font-bold">Saldo Pendiente:</div>
                <div className={`text-xl ${calculateBalance() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${calculateBalance().toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <Input
                label="Fecha de Entrega"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
              <Input
                label="Notas Internas"
                placeholder="Urgente..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end items-center gap-4 text-xl font-bold pt-4">
              <span>Total del Pedido:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button size="lg" disabled={isLoading || items.length === 0}>
            {isLoading ? "Creando Ticket..." : "Crear Ticket"}
          </Button>
        </div>
      </form>
    </div>
  );
}
