"use client";

import { useEffect, useState } from "react";
import { API_SALES } from "@/lib/api"; // Changed to API_SALES
import { OrderResponse } from "@/types/dtos"; // Changed type
import { translateStatus, getStatusColor } from "@/utils/statusUtils";
import { formatDate } from "@/utils/formatUtils";

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

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Orden de Venta</th>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3">Prendas</th>
              <th className="px-6 py-3">Fecha Límite</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? <tr><td colSpan={6} className="p-4 text-center">Cargando...</td></tr> :
              workOrders.map(wo => (
                <tr key={wo.id} className="hover:bg-muted/30">
                  <td className="px-6 py-3 font-medium font-mono text-xs">{wo.ticketNumber}</td>
                  <td className="px-6 py-3 text-xs">{wo.customer.firstName} {wo.customer.lastName}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(wo.status)}`}>
                      {translateStatus(wo.status)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs">
                    {wo.items.map(i => i.services?.map(s => s.serviceName).join(", ")).filter(Boolean).join("; ")}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">
                    {formatDate(wo.committedDeadline)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => handleComplete(wo.id)} className="text-success hover:underline font-medium">Marcar Listo</button>
                  </td>
                </tr>
              ))}
            {!loading && workOrders.length === 0 && <tr><td colSpan={6} className="p-4 text-center">No hay órdenes en progreso.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
