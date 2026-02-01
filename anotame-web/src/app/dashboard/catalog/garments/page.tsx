"use client";

import { useEffect, useState } from "react";
import { API_CATALOG } from "@/lib/api";
import { GarmentTypeResponse, GarmentTypeRequest } from "@/types/dtos";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

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
  const [formData, setFormData] = useState<GarmentTypeRequest>({ code: "", name: "", description: "" });

  const fetchGarments = async () => {
    try {
      const res = await fetch(`${API_CATALOG}/catalog/garments`);
      if (res.ok) {
        setGarments(await res.json());
      }
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
    setFormData({ code: "", name: "", description: "" });
    setIsCreateModalOpen(false);
    setGarmentToEdit(null);
  };

  // --- Create Logic ---
  const handleCreateSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_CATALOG}/catalog/garments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        fetchGarments();
        resetForm();
      } else {
        alert("Failed to create garment type");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Edit Logic ---
  const handleEditClick = (garment: GarmentTypeResponse) => {
    setFormData({
      code: garment.code,
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
      const res = await fetch(`${API_CATALOG}/catalog/garments/${garmentToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        // Optimistic update or refetch
        fetchGarments();
        resetForm();
      } else {
        alert("Failed to update garment type");
      }
    } catch (e) {
      console.error(e);
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
      const res = await fetch(`${API_CATALOG}/catalog/garments/${garmentToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setGarments(garments.filter(g => g.id !== garmentToDelete.id));
        setGarmentToDelete(null);
      } else {
        alert("Failed to delete garment type");
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
          <h1 className="text-3xl font-heading font-bold text-foreground">Garments</h1>
          <p className="text-muted-foreground">Manage types of garments (Shirts, Pants, etc).</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { resetForm(); setIsCreateModalOpen(true); }}>
            + Add Garment
          </Button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl  overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Description</th>
                {isAdmin && <th className="px-6 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? <tr><td colSpan={isAdmin ? 4 : 3} className="p-4 text-center">Loading...</td></tr> :
                garments.map(g => (
                  <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 font-medium">{g.code}</td>
                    <td className="px-6 py-3">{g.name}</td>
                    <td className="px-6 py-3">{g.description}</td>
                    {isAdmin && (
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditClick(g)}>Edit</Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteClick(g)}>Delete</Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              {!loading && garments.length === 0 && <tr><td colSpan={isAdmin ? 4 : 3} className="p-4 text-center">No garments found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={resetForm}
        title="Add New Garment"
        description="Create a new garment type."
        footer={
          <>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={() => handleCreateSubmit()} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create Garment"}
            </Button>
          </>
        }
      >
        <form className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Code"
              placeholder="e.g. SHIRT"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Input
              label="Name"
              placeholder="e.g. Shirt"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <Input
            label="Description"
            placeholder="Description of the garment type"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!garmentToEdit}
        onClose={resetForm}
        title="Edit Garment"
        description="Update garment type details."
        footer={
          <>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={() => handleEditSubmit()} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </>
        }
      >
        <form className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Code"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Input
              label="Name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <Input
            label="Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!garmentToDelete}
        onClose={() => setGarmentToDelete(null)}
        title="Confirm Deletion"
        description="Are you sure you want to delete this garment type?"
        footer={
          <>
            <Button variant="outline" onClick={() => setGarmentToDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <div className="py-4">
          <p className="text-sm">
            You are about to delete <strong>{garmentToDelete?.name}</strong>.
          </p>
        </div>
      </Modal>
    </div>
  );
}
