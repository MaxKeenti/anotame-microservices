"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Plus, Eye, FileText } from "lucide-react";
import { API_SALES } from "@/lib/api";
import { OrderResponse } from "@/types/dtos";
import Link from "next/link";

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'active' | 'drafts'>('active');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch(`${API_SALES}/orders`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, []);

  // KPIs
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const activeOrders = orders.filter(o => o.status !== "DELIVERED" && o.status !== "CANCELLED").length;
  const pendingDelivery = orders.filter(o => o.status === "READY").length;
  const uniqueCustomers = new Set(orders.map(o => o.customer.id)).size;

  // Garment Summary Helper
  const getGarmentSummary = (items: any[]) => {
    if (!items || items.length === 0) return "Sin prendas";
    const count = items.reduce((acc, item) => acc + (item.quantity || 1), 0);
    if (items.length === 1) return items[0].garmentName;
    return `${count} Prendas (${items.map(i => i.garmentName).slice(0, 2).join(", ")}${items.length > 2 ? "..." : ""})`;
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Resumen
          </h1>
          <p className="text-muted-foreground">
            Bienvenido de nuevo. Aquí tienes un resumen de hoy.
          </p>
        </div>
        <Link href="/dashboard/orders/new">
          <Button size="lg" className="shadow-lg">
            <Plus className="w-5 h-5 mr-2" />
            Nueva Orden
          </Button>
        </Link>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Ingresos"
          value={`$${totalRevenue.toFixed(2)}`}
          trend="Total"
          trendUp={true}
        />
        <StatCard
          title="Activas"
          value={String(activeOrders)}
          trend="En proceso"
          trendUp={true}
        />
        <StatCard
          title="Entrega"
          value={String(pendingDelivery)}
          trend="Listas"
          trendUp={pendingDelivery > 0}
        />
        <StatCard
          title="Clientes"
          value={String(uniqueCustomers)}
          trend="Totales"
          trendUp={true}
        />
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
          Borradores
        </button>
      </div>

      {/* Orders List */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {view === 'active' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Ticket</th>
                  <th className="px-6 py-4 whitespace-nowrap">Cliente</th>
                  <th className="px-6 py-4 min-w-[200px]">Prendas</th>
                  <th className="px-6 py-4 whitespace-nowrap">Entrega</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Total</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Pagado</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Saldo</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Estado</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Cargando órdenes...
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                      No se encontraron órdenes recientes.
                    </td>
                  </tr>
                ) : (
                  orders.slice().reverse().slice(0, 10).map((order) => {
                    const balance = (order.totalAmount || 0) - (order.amountPaid || 0);
                    return (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4 font-mono font-medium text-foreground">
                          {order.ticketNumber || "N/A"}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {order.customer.firstName} {order.customer.lastName}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {getGarmentSummary(order.items)}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                          {order.committedDeadline ? new Date(order.committedDeadline).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          ${(order.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground">
                          ${(order.amountPaid || 0).toFixed(2)}
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${balance > 0 ? "text-destructive" : "text-emerald-600"}`}>
                          ${balance.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm
                                ${order.status === 'RECEIVED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                              order.status === 'READY' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                order.status === 'DELIVERED' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                                  order.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link href={`/dashboard/orders/${order.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                              <Eye className="w-5 h-5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
            <div className="bg-muted/50 p-4 rounded-full">
              <FileText className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">No hay borradores</h3>
              <p>Los borradores guardados aparecerán aquí.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
