"use client";

import { useEffect, useState } from "react";
import { getAllGarments, createGarment, updateGarment, deleteGarment } from "@/services/catalog/garments";
import { GarmentTypeResponse, GarmentTypeRequest } from "@/types/dtos";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

import { useAuth } from "@/context/AuthContext";

export default function GarmentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [garments, setGarments] = useState<GarmentTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [garmentToEdit, setGarmentToEdit] = useState<GarmentTypeResponse | null>(null);
  const [garmentToDelete, setGarmentToDelete] = useState<GarmentTypeResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<GarmentTypeRequest>({ name: "", description: "" });

  const fetchGarments = async () => {
    try {
      const data = await getAllGarments();
      setGarments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGarments();
  }, []);

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setIsCreateModalOpen(false);
    setGarmentToEdit(null);
  };

  // --- Create Logic ---
  const handleCreateSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      await createGarment(formData);
      fetchGarments();
      resetForm();
    } catch (e) {
      console.error(e);
      alert("Failed to create garment type");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Edit Logic ---
  const handleEditClick = (garment: GarmentTypeResponse) => {
    setFormData({
      name: garment.name,
      description: garment.description
    });
    setGarmentToEdit(garment);
  };

  const handleEditSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!garmentToEdit) return;

    setIsSubmitting(true);
    try {
      await updateGarment(garmentToEdit.id, formData);
      fetchGarments();
      resetForm();
    } catch (e) {
      console.error(e);
      alert("Failed to update garment type");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Delete Logic ---
  const handleDeleteClick = (garment: GarmentTypeResponse) => {
    setGarmentToDelete(garment);
  };

  const confirmDelete = async () => {
    if (!garmentToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteGarment(garmentToDelete.id);
      setGarments(garments.filter(g => g.id !== garmentToDelete.id));
      setGarmentToDelete(null);
    } catch (e) {
      console.error(e);
      alert("Failed to delete garment type");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search Filter
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGarments = garments.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-brand text-foreground">Prendas</h1>
          <p className="text-muted-foreground">Gestionar tipos de prendas (Camisas, Pantalones, etc).</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateModalOpen(true)}>+ Agregar Prenda</Button>
        )}
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table className="w-full text-sm text-left">
          <TableHeader className="bg-secondary/20 text-muted-foreground font-medium uppercase text-xs">
            <TableRow>
              <TableHead className="px-4 py-3">Nombre</TableHead>
              <TableHead className="px-4 py-3">Descripción</TableHead>
              {isAdmin && <TableHead className="px-4 py-3 text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {loading ? (
              <TableRow><TableCell colSpan={isAdmin ? 4 : 3} className="p-4 text-center">Cargando...</TableCell></TableRow>
            ) : filteredGarments.length === 0 ? (
              <TableRow><TableCell colSpan={isAdmin ? 4 : 3} className="p-4 text-center text-muted-foreground">No se encontraron prendas.</TableCell></TableRow>
            ) : (
              filteredGarments.map((garment) => (
                <TableRow key={garment.id} className="hover:bg-secondary/10 transition-colors">
                  <TableCell className="px-4 py-3">{garment.name}</TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">{garment.description}</TableCell>
                  {isAdmin && (
                    <TableCell className="px-4 py-3 text-right flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(garment)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteClick(garment)}>Eliminar</Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Crear Nueva Prenda"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input label="Nombre" placeholder="Pantalón de Mezclilla" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Descripción" placeholder="Todo tipo de pantalones..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <div className="flex justify-end pt-2">
            <Button disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Crear"}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!garmentToEdit}
        onClose={() => !isSubmitting && setGarmentToEdit(null)}
        title="Editar Prenda"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />

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
        isOpen={!!garmentToDelete}
        onClose={() => setGarmentToDelete(null)}
        title="Confirmar Eliminación"
        description="¿Estás seguro de que deseas eliminar este tipo de prenda?"
        footer={
          <>
            <Button variant="outline" onClick={() => setGarmentToDelete(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={isSubmitting}>
              {isSubmitting ? "Eliminando..." : "Eliminar"}
            </Button>
          </>
        }
      >
        <div className="py-4">
          <p className="text-sm">
            Estás a punto de eliminar <strong>{garmentToDelete?.name}</strong>.
          </p>
        </div>
      </Modal>
    </div >
  );
}
