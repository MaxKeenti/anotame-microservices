"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { searchCustomers, deleteCustomer } from "@/services/sales/customers";
import { CustomerDto } from "@/types/dtos";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerDto | undefined>(undefined);

  const fetchCustomers = useCallback(async (query: string = "") => {
    setLoading(true);
    const results = await searchCustomers(query);
    setCustomers(results);
    setLoading(false);
  }, []);

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
      const success = await deleteCustomer(id);
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
          <h1 className="text-3xl font-heading font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gestionar base de datos de clientes.</p>
        </div>
        <Button onClick={handleCreateClick}>+ Nuevo Cliente</Button>
      </div>

      <div className="flex gap-2">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <Input
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <Button type="submit" variant="secondary">Buscar</Button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6">Nombre</TableHead>
              <TableHead className="px-6">Teléfono</TableHead>
              <TableHead className="px-6">Correo</TableHead>
              <TableHead className="px-6 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No se encontraron clientes.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="px-6 font-medium">
                    {c.firstName} {c.lastName}
                  </TableCell>
                  <TableCell className="px-6">{c.phoneNumber}</TableCell>
                  <TableCell className="px-6">{c.email || "-"}</TableCell>
                  <TableCell className="px-6 text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(c)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => c.id && handleDeleteClick(c.id)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
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
