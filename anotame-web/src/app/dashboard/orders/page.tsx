"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllOrders } from "@/services/sales/orders";
import { getAllGarments } from "@/services/catalog/garments";
import { OrderResponse, GarmentTypeResponse } from "@/types/dtos";
import { DraftsService, DraftOrder } from "@/services/local/DraftsService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
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
              <Select
                value={garmentFilter}
                onChange={(e) => setGarmentFilter(e.target.value)}
              >
                <option value="">Todas</option>
                {garments.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
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
              <Table className="w-full text-sm text-left">
                <TableHeader className="bg-muted/50 text-muted-foreground uppercase text-xs">
                  <TableRow>
                    <TableHead className="px-6 py-3">Ticket</TableHead>
                    <TableHead className="px-6 py-3">Cliente</TableHead>
                    <TableHead className="px-6 py-3">Prendas (Resumen)</TableHead>
                    <TableHead className="px-6 py-3">Estado</TableHead>
                    <TableHead className="px-6 py-3">Entrega</TableHead>
                    <TableHead className="px-6 py-3">Total</TableHead>
                    <TableHead className="px-6 py-3">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {loading ? <TableRow><TableCell colSpan={7} className="p-4 text-center">Cargando...</TableCell></TableRow> :
                    filteredOrders.map(o => (
                      <TableRow key={o.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="px-6 py-3 font-mono font-medium">{o.ticketNumber}</TableCell>
                        <TableCell className="px-6 py-3">{o.customer.firstName} {o.customer.lastName}</TableCell>
                        <TableCell className="px-6 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                          {o.items.map(i => i.garmentName).join(", ")}
                        </TableCell>
                        <TableCell className="px-6 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>
                            {translateStatus(o.status)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-3 text-muted-foreground">
                          {formatDate(o.committedDeadline)}
                        </TableCell>
                        <TableCell className="px-6 py-3 font-medium">{formatCurrency(o.totalAmount)}</TableCell>
                        <TableCell className="px-6 py-3">
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
                        </TableCell>
                      </TableRow>
                    ))}
                  {!loading && filteredOrders.length === 0 && <TableRow><TableCell colSpan={7} className="p-4 text-center text-muted-foreground">No se encontraron pedidos.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      ) : (
        /* Drafts View */
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table className="w-full text-sm text-left">
              <TableHeader className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <TableRow>
                  <TableHead className="px-6 py-3">ID (Temporal)</TableHead>
                  <TableHead className="px-6 py-3">Cliente</TableHead>
                  <TableHead className="px-6 py-3">Prendas</TableHead>
                  <TableHead className="px-6 py-3">Última Modificación</TableHead>
                  <TableHead className="px-6 py-3 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {drafts.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground">No hay borradores guardados</TableCell></TableRow>
                ) : (
                  drafts.map(d => (
                    <TableRow key={d.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="px-6 py-3 font-mono text-xs">{d.id.slice(0, 8)}...</TableCell>
                      <TableCell className="px-6 py-3 font-medium">
                        {d.customer?.firstName ? `${d.customer.firstName} ${d.customer.lastName || ''}` : <span className="text-muted-foreground italic">Sin nombre</span>}
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        {d.items?.length || 0} prendas
                      </TableCell>
                      <TableCell className="px-6 py-3 text-muted-foreground">
                        {new Date(d.lastModified).toLocaleString()}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-right">
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
