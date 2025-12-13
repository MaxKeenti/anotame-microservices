"use client";

import { useEffect, useState } from "react";
import { API_CATALOG } from "@/lib/api";
import { ServiceResponse, ServiceRequest } from "@/types/dtos";

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newService, setNewService] = useState<ServiceRequest>({ 
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await fetch(`${API_CATALOG}/catalog/services/${id}`, { method: "DELETE" });
    fetchServices();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_CATALOG}/catalog/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newService),
    });
    if (res.ok) {
      setIsCreating(false);
      setNewService({ code: "", name: "", description: "", defaultDurationMin: 60, basePrice: 0 });
      fetchServices();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-heading">Services</h1>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          + Add Service
        </button>
      </div>

      {isCreating && (
        <div className="bg-card p-4 rounded-lg border border-border">
          <h3 className="font-semibold mb-3">New Service</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
             <input type="text" placeholder="Code" className="p-2 rounded border" 
                value={newService.code} onChange={e => setNewService({...newService, code: e.target.value})} required />
             <input type="text" placeholder="Name" className="p-2 rounded border" 
                value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} required />
             <input type="text" placeholder="Description" className="p-2 rounded border" 
                value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} />
             <input type="number" placeholder="Duration (min)" className="p-2 rounded border" 
                value={newService.defaultDurationMin} onChange={e => setNewService({...newService, defaultDurationMin: parseInt(e.target.value)})} />
             <input type="number" step="0.01" placeholder="Base Price" className="p-2 rounded border" 
                value={newService.basePrice} onChange={e => setNewService({...newService, basePrice: parseFloat(e.target.value)})} />
             
             <div className="col-span-full flex gap-2 pt-2">
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
              <th className="px-6 py-3">Duration (min)</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> : 
             services.map(s => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-6 py-3 font-medium">{s.code}</td>
                <td className="px-6 py-3">{s.name}</td>
                <td className="px-6 py-3">{s.defaultDurationMin}</td>
                <td className="px-6 py-3">${s.basePrice}</td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {!loading && services.length === 0 && <tr><td colSpan={5} className="p-4 text-center">No services found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
