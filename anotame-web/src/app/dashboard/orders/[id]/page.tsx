"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_SALES } from "@/lib/api";
import { OrderResponse } from "@/types/dtos";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Need to unwrap params in Next.js 15+ (assuming latest or reasonably recent)
  // But standard way is usually params prop. 
  // Wait, in Next 15 params is async. Assuming standard Next 14/15 pattern.
  // Using `use` hook or async unwrapping.
  // I'll use standard useEffect unwrapping pattern or `use` if I knew the version.
  // Safest is to treat params as promise if needed, but in client component page props are usually available.
  // Actually, in Next.js 15, params is a Promise. In 14 it wasn't. I'll code strictly for safe compatibility.
  // But wait, "use client" component receives params.
  
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_SALES}/orders/${id}`);
        if (res.ok) {
          setOrder(await res.json());
        } else {
           // Handle error
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleCancel = async () => {
    if (!order || !confirm("Are you sure you want to cancel this order?")) return;
    try {
        const res = await fetch(`${API_SALES}/orders/${order.id}`, { method: "DELETE" });
        if (res.ok) {
            alert("Order cancelled");
            router.push("/dashboard/orders");
        }
    } catch(e) {
        console.error(e);
    }
  };

  if (!id || loading) return <div className="p-8">Loading...</div>;
  if (!order) return <div className="p-8">Order not found</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders" className="text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold font-heading">Order {order.ticketNumber}</h1>
        <span className={`px-2 py-1 rounded-full text-xs font-medium 
             ${order.status === 'RECEIVED' ? 'bg-blue-100 text-blue-800' : 
               order.status === 'READY' ? 'bg-emerald-100 text-emerald-800' : 
               'bg-gray-100 text-gray-800'}`}>
            {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="font-semibold mb-4 text-lg">Customer</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {order.customer.firstName} {order.customer.lastName}</p>
            <p><span className="text-muted-foreground">Email:</span> {order.customer.email}</p>
            <p><span className="text-muted-foreground">Phone:</span> {order.customer.phone}</p>
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="font-semibold mb-4 text-lg">Summary</h3>
          <div className="space-y-2 text-sm">
             <p><span className="text-muted-foreground">Created:</span> {new Date(order.createdAt).toLocaleString()}</p>
             <p><span className="text-muted-foreground">Deadline:</span> {order.committedDeadline ? new Date(order.committedDeadline).toLocaleDateString() : "-"}</p>
             <p className="text-xl font-bold mt-4">${(order.totalAmount || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border font-semibold">items</div>
        <table className="w-full text-sm text-left">
           <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Garment</th>
              <th className="px-6 py-3">Service</th>
              <th className="px-6 py-3">Qty</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Subtotal</th>
            </tr>
           </thead>
           <tbody className="divide-y divide-border">
             {order.items.map(item => (
                <tr key={item.id}>
                    <td className="px-6 py-3">{item.garmentName}</td>
                    <td className="px-6 py-3">{item.serviceName}</td>
                    <td className="px-6 py-3">{item.quantity}</td>
                    <td className="px-6 py-3">${item.unitPrice}</td>
                    <td className="px-6 py-3">${item.subtotal}</td>
                </tr>
             ))}
           </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-4">
        <button 
            onClick={handleCancel}
            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors"
        >
            Cancel Order
        </button>
      </div>
    </div>
  );
}
