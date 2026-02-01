"use client";

import { useEffect, useState } from "react";
import { API_CATALOG } from "@/lib/api";
import { ServiceResponse, ServiceRequest } from "@/types/dtos";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

import { useAuth } from "@/context/AuthContext";

export default function ServicesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceResponse | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<ServiceRequest>({
    code: "", name: "", description: "", defaultDurationMin: 60, basePrice: 0
  });

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_CATALOG}/catalog/services`);
      if (res.ok) {
        setServices(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const resetForm = () => {
    setFormData({ code: "", name: "", description: "", defaultDurationMin: 60, basePrice: 0 });
    setIsCreateModalOpen(false);
    setServiceToEdit(null);
  };

  // --- Create Logic ---
  const handleCreateSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_CATALOG}/catalog/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        fetchServices();
        resetForm();
      } else {
        alert("Failed to create service");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Edit Logic ---
  const handleEditClick = (service: ServiceResponse) => {
    setFormData({
      code: service.code,
      name: service.name,
      description: service.description,
      defaultDurationMin: service.defaultDurationMin,
      basePrice: service.basePrice
    });
    setServiceToEdit(service);
  };

  const handleEditSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!serviceToEdit) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_CATALOG}/catalog/services/${serviceToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        fetchServices();
        resetForm();
      } else {
        alert("Failed to update service");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Delete Logic ---
  const handleDeleteClick = (service: ServiceResponse) => {
    setServiceToDelete(service);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_CATALOG}/catalog/services/${serviceToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setServices(services.filter(s => s.id !== serviceToDelete.id));
        setServiceToDelete(null);
      } else {
        alert("Failed to delete service");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Servicios</h1>
          <p className="text-muted-foreground">Gestionar servicios ofrecidos y precios.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { resetForm(); setIsCreateModalOpen(true); }}>
            + Agregar Servicio
          </Button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl  overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Código</th>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Duración (min)</th>
                <th className="px-6 py-3">Precio</th>
                {isAdmin && <th className="px-6 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? <tr><td colSpan={isAdmin ? 5 : 4} className="p-4 text-center">Cargando...</td></tr> :
                services.map(s => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 font-medium">{s.code}</td>
                    <td className="px-6 py-3">{s.name}</td>
                    <td className="px-6 py-3">{s.defaultDurationMin}</td>
                    <td className="px-6 py-3">${s.basePrice}</td>
                    {isAdmin && (
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditClick(s)}>Editar</Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteClick(s)}>Eliminar</Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              {!loading && services.length === 0 && <tr><td colSpan={isAdmin ? 5 : 4} className="p-4 text-center">No se encontraron servicios.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={resetForm}
        title="Agregar Nuevo Servicio"
        description="Crear una nueva oferta de servicio."
        footer={
          <>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={() => handleCreateSubmit()} disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Crear Servicio"}
            </Button>
          </>
        }
      >
        <form className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Código"
              placeholder="ej. BASTILLA"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Input
              label="Nombre"
              placeholder="ej. Bastilla"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duración (min)"
              type="number"
              value={formData.defaultDurationMin}
              onChange={e => setFormData({ ...formData, defaultDurationMin: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Precio Base"
              type="number"
              step="0.01"
              value={formData.basePrice}
              onChange={e => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <Input
            label="Descripción"
            placeholder="Descripción del servicio"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!serviceToEdit}
        onClose={resetForm}
        title="Editar Servicio"
        description="Actualizar detalles del servicio."
        footer={
          <>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={() => handleEditSubmit()} disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </>
        }
      >
        <form className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Código"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Input
              label="Nombre"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duración (min)"
              type="number"
              value={formData.defaultDurationMin}
              onChange={e => setFormData({ ...formData, defaultDurationMin: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Precio Base"
              type="number"
              step="0.01"
              value={formData.basePrice}
              onChange={e => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <Input
            label="Descripción"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        title="Confirmar Eliminación"
        description="¿Estás seguro de que deseas eliminar este servicio?"
        footer={
          <>
            <Button variant="outline" onClick={() => setServiceToDelete(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={isSubmitting}>
              {isSubmitting ? "Eliminando..." : "Eliminar"}
            </Button>
          </>
        }
      >
        <div className="py-4">
          <p className="text-sm">
            Estás a punto de eliminar <strong>{serviceToDelete?.name}</strong>.
          </p>
        </div>
      </Modal>
    </div>
  );
}
