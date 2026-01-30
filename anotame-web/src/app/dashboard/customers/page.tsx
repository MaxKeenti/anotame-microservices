"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { searchCustomers, deleteCustomer } from "@/services/sales/customers";
import { CustomerDto } from "@/types/dtos";
import { useAuth } from "@/context/AuthContext";

export default function CustomersPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerDto | undefined>(undefined);

  const fetchCustomers = useCallback(async (query: string = "") => {
    setLoading(true);
    const results = await searchCustomers(query, token || undefined);
    setCustomers(results);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchQuery);
  };

  const handleCreateClick = () => {
    router.push("/dashboard/customers/new");
  };

  const handleEditClick = (customer: CustomerDto) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      const success = await deleteCustomer(id, token || undefined);
      if (success) {
        fetchCustomers(searchQuery);
      } else {
        alert("Failed to delete customer");
      }
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchCustomers(searchQuery);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage your customer base.</p>
        </div>
        <Button onClick={handleCreateClick}>+ New Customer</Button>
      </div>

      <div className="flex gap-2">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center">No customers found.</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 font-medium">{c.firstName} {c.lastName}</td>
                    <td className="px-6 py-3">{c.phoneNumber}</td>
                    <td className="px-6 py-3">{c.email || "-"}</td>
                    <td className="px-6 py-3 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(c)}>Edit</Button>
                      <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={() => c.id && handleDeleteClick(c.id)}>Delete</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? "Edit Customer" : "New Customer"}
      >
        <CustomerForm
          initialData={editingCustomer}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
