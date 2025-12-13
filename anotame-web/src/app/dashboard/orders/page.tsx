"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_SALES } from "@/lib/api";
import { OrderResponse } from "@/types/dtos";

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-heading">Orders</h1>
        <Link 
          href="/dashboard/orders/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          + New Order
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Ticket</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> : 
             orders.map(o => (
              <tr key={o.id} className="hover:bg-muted/30">
                <td className="px-6 py-3 font-medium">{o.ticketNumber}</td>
                <td className="px-6 py-3">{o.customer.firstName} {o.customer.lastName}</td>
                <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${o.status === 'RECEIVED' ? 'bg-blue-100 text-blue-800' : 
                          o.status === 'READY' ? 'bg-emerald-100 text-emerald-800' : 
                          o.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                    {o.status}
                    </span>
                </td>
                <td className="px-6 py-3">${(o.totalAmount || 0).toFixed(2)}</td>
                <td className="px-6 py-3">
                  <Link href={`/dashboard/orders/${o.id}`} className="text-primary hover:underline">Details</Link>
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && <tr><td colSpan={5} className="p-4 text-center">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
