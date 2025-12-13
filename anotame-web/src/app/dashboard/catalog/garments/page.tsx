"use client";

import { useEffect, useState } from "react";
import { API_CATALOG } from "@/lib/api";
import { GarmentTypeResponse, GarmentTypeRequest } from "@/types/dtos";

export default function GarmentsPage() {
  const [garments, setGarments] = useState<GarmentTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newGarment, setNewGarment] = useState<GarmentTypeRequest>({ code: "", name: "", description: "" });

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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await fetch(`${API_CATALOG}/catalog/garments/${id}`, { method: "DELETE" });
    fetchGarments();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_CATALOG}/catalog/garments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newGarment),
    });
    if (res.ok) {
      setIsCreating(false);
      setNewGarment({ code: "", name: "", description: "" });
      fetchGarments();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-heading">Garments</h1>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          + Add Garment
        </button>
      </div>

      {isCreating && (
        <div className="bg-card p-4 rounded-lg border border-border">
          <h3 className="font-semibold mb-3">New Garment</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-muted p-4 rounded-md">
             <input type="text" placeholder="Code (e.g. SHIRT)" className="p-2 rounded border" 
                value={newGarment.code} onChange={e => setNewGarment({...newGarment, code: e.target.value})} required />
             <input type="text" placeholder="Name (e.g. Shirt)" className="p-2 rounded border" 
                value={newGarment.name} onChange={e => setNewGarment({...newGarment, name: e.target.value})} required />
             <input type="text" placeholder="Description" className="p-2 rounded border" 
                value={newGarment.description} onChange={e => setNewGarment({...newGarment, description: e.target.value})} />
             <div className="col-span-full flex gap-2">
                <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">Save</button>
                <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1 bg-gray-400 text-white rounded">Cancel</button>
             </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Code</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> : 
             garments.map(g => (
              <tr key={g.id} className="hover:bg-muted/30">
                <td className="px-6 py-3 font-medium">{g.code}</td>
                <td className="px-6 py-3">{g.name}</td>
                <td className="px-6 py-3">{g.description}</td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => handleDelete(g.id)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {!loading && garments.length === 0 && <tr><td colSpan={4} className="p-4 text-center">No garments found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
