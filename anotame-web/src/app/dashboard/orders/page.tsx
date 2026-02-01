"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_SALES } from "@/lib/api";
import { OrderResponse } from "@/types/dtos";
import { Button } from "@/components/ui/Button";

export default function ServicesPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_SALES}/orders`);
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      'RECEIVED': 'RECIBIDO',
      'IN_PROGRESS': 'EN PROGRESO',
      'READY': 'LISTO',
      'DELIVERED': 'ENTREGADO',
      'CANCELLED': 'CANCELADO'
    };
    return map[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground">Ver y gestionar pedidos de clientes.</p>
        </div>
        <Link
          href="/dashboard/orders/new"
        >
          <Button>+ Nuevo Pedido</Button>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Ticket</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? <tr><td colSpan={5} className="p-4 text-center">Cargando...</td></tr> :
                orders.map(o => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 font-medium">{o.ticketNumber}</td>
                    <td className="px-6 py-3">{o.customer.firstName} {o.customer.lastName}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${o.status === 'RECEIVED' ? 'bg-blue-100 text-blue-800' :
                          o.status === 'READY' ? 'bg-emerald-100 text-emerald-800' :
                            o.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'}`}>
                        {getStatusLabel(o.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3">${(o.totalAmount || 0).toFixed(2)}</td>
                    <td className="px-6 py-3">
                      <Link href={`/dashboard/orders/${o.id}`}>
                        <Button variant="outline" size="sm">Detalles</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              {!loading && orders.length === 0 && <tr><td colSpan={5} className="p-4 text-center">No se encontraron pedidos.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
