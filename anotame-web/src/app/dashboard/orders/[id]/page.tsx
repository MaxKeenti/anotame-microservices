"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_SALES } from "@/lib/api";
import { OrderResponse, Establishment } from "@/types/dtos";
import { getSettings } from "@/services/operations/establishment";
import { generateReceiptHtml } from "@/utils/receipt-generator";
import { translateStatus, getStatusColor } from "@/utils/statusUtils";



export default function OrderDetailsPage({ params, searchParams }: {
  params: Promise<{ id: string }>,
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);

  useEffect(() => {
    getSettings().then(setEstablishment).catch(console.error);
  }, []);

  const [id, setId] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setId(p.id));
    if (searchParams) {
      searchParams.then(sp => {
        if (sp && sp.action) setAction(sp.action as string);
      });
    }
  }, [params, searchParams]);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_SALES}/orders/${id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  // Handle auto-print action
  useEffect(() => {
    if (action === 'print' && order && establishment && !loading) {
      // Clear action to prevent double prompt
      setAction(null);
      // Remove query param from URL without reload
      window.history.replaceState(null, '', `/dashboard/orders/${id}`);

      // Small timeout to let UI render completely
      setTimeout(() => {
        if (confirm("Pedido creado con éxito. ¿Deseas imprimir el ticket ahora?")) {
          handlePrint();
        }
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, order, establishment, loading, id]);

  const handleCancel = async () => {
    if (!order || !confirm("¿Estás seguro que deseas cancelar este pedido?")) return;
    try {
      const res = await fetch(`${API_SALES}/orders/${order.id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Pedido cancelado");
        router.push("/dashboard/orders");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    if (!order) return;

    const receiptHtml = generateReceiptHtml({
      ticketNumber: order.ticketNumber,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      phone: order.customer.phoneNumber,
      deadline: order.committedDeadline || new Date().toISOString(),
      items: order.items.map(i => ({
        garment: i.garmentName,
        service: i.serviceName,
        notes: i.notes,
        price: i.unitPrice,
        adjustment: i.adjustmentAmount,
        adjustmentReason: i.adjustmentReason,
      })),
      total: order.totalAmount,
      amountPaid: 0,
      balance: order.totalAmount,
      establishment: {
        name: establishment?.name || "ANOTAME",
        address: establishment?.taxInfo ? JSON.parse(establishment.taxInfo).address : undefined,
        rfc: establishment?.taxInfo ? JSON.parse(establishment.taxInfo).rfc : undefined,
        taxRegime: establishment?.taxInfo ? JSON.parse(establishment.taxInfo).regime : undefined,
        contactPhone: establishment?.taxInfo ? JSON.parse(establishment.taxInfo).contactPhone : undefined,
      }
    });

    const newWindow = window.open('', '_blank', 'width=400,height=600');
    if (newWindow) {
      newWindow.document.write(receiptHtml);
      newWindow.document.close();
      newWindow.setTimeout(() => {
        newWindow.focus();
        newWindow.print();
        newWindow.close();
      }, 250);
    }
  };

  const handleSendToOps = async () => {
    if (!order || !confirm("¿Enviar pedido a Operaciones? El estado cambiará a EN PROGRESO.")) return;
    try {
      const res = await fetch(`${API_SALES}/orders/${order.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "IN_PROGRESS" })
      });

      if (res.ok) {
        alert("¡Pedido enviado a Operaciones!");
        setLoading(true);
        const newRes = await fetch(`${API_SALES}/orders/${id}`);
        if (newRes.ok) setOrder(await newRes.json());
        setLoading(false);
      } else {
        alert("Error al actualizar estado.");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
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
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
          {translateStatus(order.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="font-semibold mb-4 text-lg">Cliente</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Nombre:</span> {order.customer.firstName} {order.customer.lastName}</p>
            <p><span className="text-muted-foreground">Correo:</span> {order.customer.email}</p>
            <p><span className="text-muted-foreground">Teléfono:</span> {order.customer.phoneNumber || "-"}</p>
          </div>
        </div>

        {/* Order Info & Payment */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="font-semibold mb-4 text-lg">Detalles del Pedido</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Creado:</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entrega Estimada:</span>
              <span className="font-medium">{order.committedDeadline ? new Date(order.committedDeadline).toLocaleDateString() + " " + new Date(order.committedDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}</span>
            </div>

            <div className="h-px bg-border my-2" />

            <div className="flex justify-between">
              <span className="text-muted-foreground">Método de Pago:</span>
              <span className="font-medium">{order.paymentMethod === 'CASH' ? 'Efectivo' : order.paymentMethod === 'CARD' ? 'Tarjeta' : order.paymentMethod === 'TRANSFER' ? 'Transferencia' : order.paymentMethod || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">${(order.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">A cuenta:</span>
              <span className="font-medium text-emerald-600">-${(order.amountPaid || 0).toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between items-center">
              <span className="font-bold">Saldo Pendiente:</span>
              <span className={`text-xl font-bold ${((order.totalAmount || 0) - (order.amountPaid || 0)) > 0.01 ? 'text-destructive' : 'text-emerald-600'}`}>
                ${Math.max(0, (order.totalAmount || 0) - (order.amountPaid || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Notes */}
      {order.notes && (
        <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-200 text-yellow-900">
          <h3 className="font-semibold mb-1 text-sm uppercase tracking-wide opacity-70">Notas Generales</h3>
          <p className="text-sm font-medium">{order.notes}</p>
        </div>
      )}

      {/* Items */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border font-semibold">Prendas y Servicios</div>
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Descripción</th>
              <th className="px-6 py-3">Servicio</th>
              <th className="px-6 py-3">Cant</th>
              <th className="px-6 py-3">Precio</th>
              <th className="px-6 py-3">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {order.items.map(item => (
              <tr key={item.id}>
                <td className="px-6 py-3">
                  <div className="font-bold">{item.garmentName}</div>
                  {item.notes && <div className="text-xs text-muted-foreground mt-1 bg-muted/30 p-1 rounded inline-block"> Nota: {item.notes}</div>}
                  {item.adjustmentReason && <div className="text-xs text-amber-600 mt-1 font-medium"> Ajuste: {item.adjustmentReason}</div>}
                </td>
                <td className="px-6 py-3">{item.serviceName}</td>
                <td className="px-6 py-3">{item.quantity}</td>
                <td className="px-6 py-3">
                  <div>${item.unitPrice}</div>
                  {item.adjustmentAmount && item.adjustmentAmount !== 0 ? (
                    <div className={`text-xs ${item.adjustmentAmount > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                      {item.adjustmentAmount > 0 ? '+' : ''}{item.adjustmentAmount}
                    </div>
                  ) : null}
                </td>
                <td className="px-6 py-3 font-medium">${item.subtotal}</td>
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
