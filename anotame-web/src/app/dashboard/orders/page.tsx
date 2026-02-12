"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_SALES, API_CATALOG } from "@/lib/api";
import { OrderResponse, GarmentTypeResponse } from "@/types/dtos";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { translateStatus, getStatusColor } from "@/utils/statusUtils";
import { formatCurrency, formatDate } from "@/utils/formatUtils";

export default function ServicesPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [garments, setGarments] = useState<GarmentTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(""); // Ticket or Client
  const [garmentFilter, setGarmentFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, garmentsRes] = await Promise.all([
        fetch(`${API_SALES}/orders`),
        fetch(`${API_CATALOG}/catalog/garments`)
      ]);

      if (ordersRes.ok) setOrders(await ordersRes.json());
      // Handle garments fetch gracefully as it's secondary
      if (garmentsRes.ok) setGarments(await garmentsRes.json());

    } catch (e) {
      console.error("Error fetching data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



  // Filter Logic
  const filteredOrders = orders.filter(order => {
    // 1. Search Query (Ticket or Client Name)
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      order.ticketNumber.toLowerCase().includes(query) ||
      order.customer.firstName.toLowerCase().includes(query) ||
      order.customer.lastName.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // 2. Garment Filter (Check if ANY item in order matches garment type)
    // Note: Items in OrderResponse have 'garmentName', but we might filter by ID if we mapped it, 
    // or just strict name match. OrderItemResponse doesn't strictly have garmentTypeId, 
    // but let's check if we can match by name or if we need to be loose.
    // The GarmentResponse has 'name'. The Item has 'garmentName'.
    if (garmentFilter) {
      const selectedGarment = garments.find(g => g.id === garmentFilter);
      if (selectedGarment) {
        // We match if any item's garmentName includes the selected garment's name (heuristic)
        // or exactly matches.
        const hasGarment = order.items.some(item =>
          item.garmentName === selectedGarment.name
        );
        if (!hasGarment) return false;
      }
    }

    // 3. Date Filter (Delivery Date)
    if (dateFilter) {
      if (!order.committedDeadline) return false;
      const orderDate = order.committedDeadline.split('T')[0];
      if (orderDate !== dateFilter) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-brand text-foreground">Pedidos</h1>
          <p className="text-muted-foreground">Ver y gestionar pedidos de clientes.</p>
        </div>
        <Link href="/dashboard/orders/new">
          <Button>+ Nuevo Pedido</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-card border border-border rounded-lg">
        <div className="col-span-2">
          <Input
            label="Buscar"
            placeholder="Ticket, Nombre del Cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block text-muted-foreground">Filtrar por Prenda</label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={garmentFilter}
            onChange={(e) => setGarmentFilter(e.target.value)}
          >
            <option value="">Todas</option>
            {garments.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Input
            label="Fecha de Entrega"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Ticket</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Prendas (Resumen)</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Entrega</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? <tr><td colSpan={7} className="p-4 text-center">Cargando...</td></tr> :
                filteredOrders.map(o => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 font-mono font-medium">{o.ticketNumber}</td>
                    <td className="px-6 py-3">{o.customer.firstName} {o.customer.lastName}</td>
                    <td className="px-6 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                      {o.items.map(i => i.garmentName).join(", ")}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>
                        {translateStatus(o.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {formatDate(o.committedDeadline)}
                    </td>
                    <td className="px-6 py-3 font-medium">{formatCurrency(o.totalAmount)}</td>
                    <td className="px-6 py-3">
                      <Link href={`/dashboard/orders/${o.id}`}>
                        <Button variant="outline" size="sm">Detalles</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              {!loading && filteredOrders.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No se encontraron pedidos.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
