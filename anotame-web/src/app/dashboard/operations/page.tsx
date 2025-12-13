"use client";

import { useEffect, useState } from "react";
import { API_OPERATIONS } from "@/lib/api";
import { WorkOrder } from "@/types/dtos";

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkOrders = async () => {
    try {
      const res = await fetch(`${API_OPERATIONS}/operations/work-orders`);
      if (res.ok) {
        setWorkOrders(await res.json());
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

  const handleDelete = async (id: string) => {
     if (!confirm("Are you sure?")) return;
     await fetch(`${API_OPERATIONS}/operations/work-orders/${id}`, { method: "DELETE" });
     fetchWorkOrders();
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-heading">Operations Control</h1>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Work Order ID</th>
              <th className="px-6 py-3">Sales Order ID</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Items</th>
              <th className="px-6 py-3">Last Update</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr> : 
             workOrders.map(wo => (
              <tr key={wo.id} className="hover:bg-muted/30">
                <td className="px-6 py-3 font-medium font-mono text-xs">{wo.id.substring(0, 8)}...</td>
                <td className="px-6 py-3 font-mono text-xs">{wo.salesOrderId.substring(0, 8)}...</td>
                <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${wo.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                          wo.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 
                          wo.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                    {wo.status}
                    </span>
                </td>
                <td className="px-6 py-3">{wo.items.length} items</td>
                <td className="px-6 py-3 text-muted-foreground">
                    {wo.updatedAt ? new Date(wo.updatedAt).toLocaleDateString() : new Date(wo.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => handleDelete(wo.id)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {!loading && workOrders.length === 0 && <tr><td colSpan={6} className="p-4 text-center">No work orders found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
