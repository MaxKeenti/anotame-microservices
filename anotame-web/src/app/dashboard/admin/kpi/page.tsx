"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { API_SALES } from "@/lib/api";
import { OrderResponse } from "@/types/dtos";
import { formatCurrency } from "@/utils/formatUtils";

export default function AdminKPIPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Métricas del Negocio
          </h1>
          <p className="text-muted-foreground">
            Resumen de desempeño y KPIs (Vista de Administrador).
          </p>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Ingresos"
          value={formatCurrency(totalRevenue)}
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
    </div>
  );
}
