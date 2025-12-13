"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { API_SALES } from "@/lib/api";
import { OrderResponse } from "@/types/dtos";
import Link from "next/link";

export default function DashboardPage() {
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
  const pendingDelivery = orders.filter(o => o.status === "READY").length; // Example logic
  const uniqueCustomers = new Set(orders.map(o => o.customer.id)).size;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Overview
        </h1>
        <p className="text-muted-foreground">
          Welcome back. Here's what's happening today.
        </p>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toFixed(2)}`} 
          trend="All time" 
          trendUp={true} 
        />
        <StatCard 
          title="Active Orders" 
          value={String(activeOrders)} 
          trend="In progress" 
          trendUp={true} 
        />
        <StatCard 
          title="Ready for Delivery" 
          value={String(pendingDelivery)} 
          trend="Action needed" 
          trendUp={pendingDelivery > 0} 
        />
        <StatCard 
          title="Total Customers" 
          value={String(uniqueCustomers)} 
          trend="Unique" 
          trendUp={true} 
        />
      </div>

      {/* Recent Activity Section */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h3 className="font-heading font-semibold text-lg">Recent Orders</h3>
           <Link href="/dashboard/orders/new" className="text-sm text-primary hover:underline">
            + New Order
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Order Ticket</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No orders found.</td>
                </tr>
              ) : (
                orders.slice().reverse().slice(0, 10).map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                        {order.ticketNumber || "PENDING"}
                    </td>
                    <td className="px-6 py-4">
                        {order.customer.firstName} {order.customer.lastName}
                    </td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${order.status === 'RECEIVED' ? 'bg-blue-100 text-blue-800' : 
                              order.status === 'READY' ? 'bg-emerald-100 text-emerald-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                        {order.status}
                        </span>
                    </td>
                    <td className="px-6 py-4">${(order.totalAmount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
