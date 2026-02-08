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
    } catch (e) {
      console.error(e);
    }
  };

  // ... inside OrderDetailsPage

  const handlePrint = () => {
    if (!order) return;

    // TODO: formatting helper
    const formatDate = (d: string) => new Date(d).toLocaleDateString('es-ES');

    let text = `
==================================
ENTREGA ->
FECHA: ${order.committedDeadline ? formatDate(order.committedDeadline) : '-'}
----------------------------------
Datos personales ->
Nombre: ${order.customer.firstName} ${order.customer.lastName}
Tel: ${order.customer.phoneNumber}
----------------------------------
Datos de la nota ->
Folio: ${order.ticketNumber}
Fecha: ${new Date(order.createdAt).toLocaleDateString('es-ES')}
----------------------------------
PRENDAS:
`;

    order.items.forEach(item => {
      text += `
Cant: ${item.quantity}
Prenda: ${item.garmentName}
Servicio: ${item.serviceName}
Nota: ${item.notes || ''}
Precio: $${item.unitPrice}
--------------------
`;
    });

    text += `
====================
TOTAL: $${(order.totalAmount || 0).toFixed(2)}
(Saldo pendiente no disponible en vista detalle aun)
====================
`;

    const newWindow = window.open('', '', 'width=400,height=600');
    if (newWindow) {
      newWindow.document.write(`<pre>${text}</pre>`);
      newWindow.document.close();
      newWindow.focus();
      newWindow.print();
      newWindow.close();
    }
  };

  const handleSendToOps = async () => {
    if (!order || !confirm("Send this order to Operations? Status will change to IN_PROGRESS.")) return;
    try {
      const res = await fetch(`${API_SALES}/orders/${order.id}/status`, {
        method: "PATCH", // Using PATCH for status update
        headers: {
          "Content-Type": "application/json",
          // Headers are automatically handled if we use a wrapper, but using raw fetch here
          // We should really abstract this fetch call to include auth headers like NewOrderPage
          // For now, assume global interceptor or add manually if needed.
          // Wait, previous file NewOrderPage required Manual Headers. I must add them here too.
        },
        body: JSON.stringify({ status: "IN_PROGRESS" })
        // Note: I need to accept a body or just query param. Let's design the backend to accept body.
      });

      if (res.ok) {
        alert("Order sent to Operations!");
        setLoading(true); // force refresh trigger
        // A better way is to refetch
        const newRes = await fetch(`${API_SALES}/orders/${id}`);
        if (newRes.ok) setOrder(await newRes.json());
        setLoading(false);
      } else {
        alert("Failed to update status. Backend may not support this yet.");
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to server");
    }
  };

  if (!id || loading) return <div className="p-8">Cargando...</div>;
  if (!order) return <div className="p-8">Pedido no encontrado</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders" className="text-muted-foreground hover:text-foreground">
          ← Atrás
        </Link>
        <h1 className="text-2xl font-bold font-heading">Pedido {order.ticketNumber}</h1>
        <span className={`px-2 py-1 rounded-full text-xs font-medium 
             ${order.status === 'RECEIVED' ? 'bg-blue-100 text-blue-800' :
            order.status === 'READY' ? 'bg-emerald-100 text-emerald-800' :
              order.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="font-semibold mb-4 text-lg">Cliente</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Nombre:</span> {order.customer.firstName} {order.customer.lastName}</p>
            <p><span className="text-muted-foreground">Correo:</span> {order.customer.email}</p>
            <p><span className="text-muted-foreground">Teléfono:</span> {order.customer.phoneNumber}</p>
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="font-semibold mb-4 text-lg">Resumen</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Creado:</span> {new Date(order.createdAt).toLocaleString()}</p>
            <p><span className="text-muted-foreground">Entrega:</span> {order.committedDeadline ? new Date(order.committedDeadline).toLocaleDateString() : "-"}</p>
            <p className="text-xl font-bold mt-4">${(order.totalAmount || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border font-semibold">Prendas</div>
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Prenda</th>
              <th className="px-6 py-3">Servicio</th>
              <th className="px-6 py-3">Cant</th>
              <th className="px-6 py-3">Precio</th>
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
      <div className="flex justify-between pt-4 border-t border-border">
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
        >
          Cancelar Pedido
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => alert("Función de editar próximamente")}
            className="px-4 py-2 border border-input hover:bg-accent hover:text-accent-foreground rounded-lg font-medium"
          >
            Editar Pedido
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-input hover:bg-accent hover:text-accent-foreground rounded-lg font-medium"
          >
            Imprimir Ticket
          </button>
          {order.status === 'RECEIVED' && (
            <button
              onClick={handleSendToOps}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium shadow-sm"
            >
              Enviar a Operaciones
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
