"use client";

import Link from "next/link";
import { Plus, Users, ShoppingBag, List, BarChart2 } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Inicio
          </h1>
          <p className="text-muted-foreground">
            Bienvenido. ¿Qué deseas hacer hoy?
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Link href="/dashboard/orders/new" className="group">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all h-full flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Nueva Orden</h3>
              <p className="text-sm text-muted-foreground">Crear un nuevo pedido</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/orders" className="group">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all h-full flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <List className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Pedidos</h3>
              <p className="text-sm text-muted-foreground">Ver pedidos y borradores</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/customers" className="group">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all h-full flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Clientes</h3>
              <p className="text-sm text-muted-foreground">Gestionar cartera de clientes</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/catalog/services" className="group">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all h-full flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Catálogo</h3>
              <p className="text-sm text-muted-foreground">Servicios, prendas y listas</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/admin/kpi" className="group">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all h-full flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Métricas (Admin)</h3>
              <p className="text-sm text-muted-foreground">Ver resumen y KPIs</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
