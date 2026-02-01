"use client";

import { useEffect, useState } from "react";
import { API_CATALOG } from "@/lib/api";
import { ServiceResponse, ServiceRequest, GarmentTypeResponse } from "@/types/dtos";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

import { useAuth } from "@/context/AuthContext";

export default function ServicesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [garments, setGarments] = useState<GarmentTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [garmentFilter, setGarmentFilter] = useState("");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceResponse | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<ServiceRequest>({
    code: "", name: "", description: "", defaultDurationMin: 60, basePrice: 0
  });

  const fetchData = async () => {
    try {
      const [servicesRes, garmentsRes] = await Promise.all([
        fetch(`${API_CATALOG}/catalog/services`),
        fetch(`${API_CATALOG}/catalog/garments`)
      ]);

      if (servicesRes.ok) setServices(await servicesRes.json());
      if (garmentsRes.ok) setGarments(await garmentsRes.json());

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({ code: "", name: "", description: "", defaultDurationMin: 60, basePrice: 0 });
    setIsCreateModalOpen(false);
    setServiceToEdit(null);
  };

  // --- Filter Logic ---
  const getFilteredServices = () => {
    return services.filter(s => {
      // 1. Text Search
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Garment Filter (Heuristic)
      if (garmentFilter) {
        const garment = garments.find(g => g.id === garmentFilter);
        if (garment) {
          let prefix = "";
          switch (garment.code) {
            case "GT-PANT": prefix = "SRV-PANT"; break;
            case "GT-BLUSA": prefix = "SRV-BLU"; break;
            case "GT-FALDA": prefix = "SRV-FAL"; break;
            case "GT-SACO": prefix = "SRV-SACO"; break;
            case "GT-VAR": prefix = "SRV-VAR"; break;
            default: return true; // Loose match if unknown
          }
          if (!s.code.startsWith(prefix)) return false;
        }
      }
      return true;
    });
  };

  const filteredServices = getFilteredServices();

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
        fetchData();
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
        fetchData();
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

  const handleDeleteSubmit = async () => {
    if (!serviceToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_CATALOG}/catalog/services/${serviceToDelete.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchData();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-brand text-foreground">Servicios</h1>
          <p className="text-muted-foreground">Gestionar servicios ofrecidos y precios.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateModalOpen(true)}>+ Agregar Servicio</Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar por código o nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-64">
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={garmentFilter}
            onChange={(e) => setGarmentFilter(e.target.value)}
          >
            <option value="">Todas las Prendas</option>
            {garments.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/20 text-muted-foreground font-medium uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Duración (min)</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center">Cargando...</td></tr>
            ) : filteredServices.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No se encontraron servicios.</td></tr>
            ) : (
              filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-secondary/10 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium">{service.code}</td>
                  <td className="px-4 py-3">{service.name}</td>
                  <td className="px-4 py-3">{service.defaultDurationMin}</td>
                  <td className="px-4 py-3 font-bold">${service.basePrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    {isAdmin && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(service)}>Editar</Button>
                        <Button variant="danger" size="sm" onClick={() => setServiceToDelete(service)}>Eliminar</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Crear Nuevo Servicio"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input label="Código (Único)" placeholder="SRV-BASTILLA" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
          <Input label="Nombre" placeholder="Bastilla" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Descripción" placeholder="Detalle del servicio" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <Input label="Duración (min)" type="number" value={formData.defaultDurationMin} onChange={(e) => setFormData({ ...formData, defaultDurationMin: parseInt(e.target.value) })} />
          <Input label="Precio Base ($)" type="number" step="0.01" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })} required />

          <div className="flex justify-end pt-2">
            <Button disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Crear"}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!serviceToEdit}
        onClose={() => !isSubmitting && setServiceToEdit(null)}
        title="Editar Servicio"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />

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
          <div className="flex justify-end pt-2">
            <Button disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar"}</Button>
          </div>
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
            <Button variant="danger" onClick={handleDeleteSubmit} disabled={isSubmitting}>
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
    </div >
  );
}
