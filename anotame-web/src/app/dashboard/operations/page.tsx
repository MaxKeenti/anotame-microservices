"use client";

import { useEffect, useState } from "react";
import { API_SALES } from "@/lib/api"; // Changed to API_SALES
import { OrderResponse } from "@/types/dtos"; // Changed type
import { translateStatus, getStatusColor } from "@/utils/statusUtils";
import { formatDate } from "@/utils/formatUtils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkOrders = async () => {
    try {
      const res = await fetch(`${API_SALES}/orders`);
      if (res.ok) {
        const allOrders: OrderResponse[] = await res.json();
        // Client-side filtering for IN_PROGRESS orders
        // In a real microservices architecture, operations-service would sync this,
        // or we would have a specific endpoint /orders/search?status=IN_PROGRESS
        const filtered = allOrders.filter(o => o.status === 'IN_PROGRESS');
        setWorkOrders(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  // Mock delete/complete for visualization using the new PATCH endpoint
  const handleComplete = async (id: string) => {
    if (!confirm("¿Desea marcar esta orden como lista? (Cambiará el estado a LISTO)")) return;
    // For now, let's just complete it to remove it from this view
    try {
      await fetch(`${API_SALES}/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "READY" })
      });
      fetchWorkOrders();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-heading">Control de Operaciones</h1>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-6 py-3">Orden de Venta</TableHead>
            <TableHead className="px-6 py-3">Cliente</TableHead>
            <TableHead className="px-6 py-3">Estado</TableHead>
            <TableHead className="px-6 py-3">Prendas</TableHead>
            <TableHead className="px-6 py-3">Fecha Límite</TableHead>
            <TableHead className="px-6 py-3 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">Cargando...</TableCell>
            </TableRow>
          ) : workOrders.map(wo => (
            <TableRow key={wo.id}>
              <TableCell className="px-6 py-3 font-medium font-mono text-xs">{wo.ticketNumber}</TableCell>
              <TableCell className="px-6 py-3 text-xs">{wo.customer.firstName} {wo.customer.lastName}</TableCell>
              <TableCell className="px-6 py-3">
                <Badge variant={
                  wo.status === 'COMPLETED' || wo.status === 'READY' ? 'success' :
                    wo.status === 'CANCELLED' ? 'destructive' :
                      wo.status === 'PENDING' ? 'warning' :
                        'secondary'
                }>
                  {translateStatus(wo.status)}
                </Badge>
              </TableCell>
              <TableCell className="px-6 py-3 text-xs">
                {wo.items.map(i => i.services?.map(s => s.serviceName).join(", ")).filter(Boolean).join("; ")}
              </TableCell>
              <TableCell className="px-6 py-3 text-muted-foreground text-xs">
                {formatDate(wo.committedDeadline)}
              </TableCell>
              <TableCell className="px-6 py-3 text-right">
                <Button variant="ghost" size="sm" onClick={() => handleComplete(wo.id)} className="text-green-600 hover:text-green-700 hover:bg-green-50">Marcar Listo</Button>
              </TableCell>
            </TableRow>
          ))}
          {!loading && workOrders.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No hay órdenes en progreso.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
