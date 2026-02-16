"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllOrders } from "@/services/sales/orders";
import { getAllGarments } from "@/services/catalog/garments";
import { OrderResponse, GarmentTypeResponse } from "@/types/dtos";
import { DraftsService, DraftOrder } from "@/services/local/DraftsService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { translateStatus, getStatusColor } from "@/utils/statusUtils";
import { formatCurrency, formatDate } from "@/utils/formatUtils";
import { Edit, Trash2 } from "lucide-react";

export default function ServicesPage() {
  const [view, setView] = useState<'active' | 'drafts'>('active');
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [drafts, setDrafts] = useState<DraftOrder[]>([]);
  const [garments, setGarments] = useState<GarmentTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(""); // Ticket or Client
  const [garmentFilter, setGarmentFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, garmentsData] = await Promise.all([
        getAllOrders(),
        getAllGarments()
      ]);

      setOrders(ordersData);
      setGarments(garmentsData);

      // Fetch Drafts
      setDrafts(DraftsService.getAll());

    } catch (e) {
      console.error("Error fetching data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteDraft = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este borrador?")) {
      DraftsService.delete(id);
      setDrafts(prev => prev.filter(d => d.id !== id));
    }
  };

  // Filter Logic
  const filteredOrders = orders.filter(order => {
    // 1. Search Query (Ticket or Client Name)
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      order.ticketNumber.toLowerCase().includes(query) ||
      order.customer.firstName.toLowerCase().includes(query) ||
      order.customer.lastName.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // 2. Garment Filter
    if (garmentFilter) {
      const selectedGarment = garments.find(g => g.id === garmentFilter);
      if (selectedGarment) {
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

      {/* Toggle View */}
      <div className="flex bg-muted/20 p-1 rounded-xl w-fit">
        <button
          onClick={() => setView('active')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${view === 'active'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          Órdenes Activas
        </button>
        <button
          onClick={() => setView('drafts')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${view === 'drafts'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          Borradores ({drafts.length})
        </button>
      </div>

      {view === 'active' ? (
        <>
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
              <DatePicker
                label="Fecha de Entrega"
                value={dateFilter}
                onChange={(date) => {
                  const isoDate = date.toISOString().split('T')[0];
                  setDateFilter(isoDate);
                }}
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
                          <div className="flex gap-2">
                            <Link href={`/dashboard/orders/${o.id}/edit`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link href={`/dashboard/orders/${o.id}`}>
                              <Button variant="outline" size="sm">Detalles</Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {!loading && filteredOrders.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No se encontraron pedidos.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Drafts View */
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">ID (Temporal)</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Prendas</th>
                  <th className="px-6 py-3">Última Modificación</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {drafts.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hay borradores guardados</td></tr>
                ) : (
                  drafts.map(d => (
                    <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs">{d.id.slice(0, 8)}...</td>
                      <td className="px-6 py-3 font-medium">
                        {d.customer?.firstName ? `${d.customer.firstName} ${d.customer.lastName || ''}` : <span className="text-muted-foreground italic">Sin nombre</span>}
                      </td>
                      <td className="px-6 py-3">
                        {d.items?.length || 0} prendas
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {new Date(d.lastModified).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/orders/new?draftId=${d.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDeleteDraft(d.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
