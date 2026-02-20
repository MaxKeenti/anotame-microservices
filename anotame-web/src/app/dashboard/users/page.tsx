"use client";

import { useEffect, useState } from "react";
import { API_IDENTITY } from "@/lib/api";
import { User } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_IDENTITY}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- Delete Logic ---
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_IDENTITY}/users/${userToDelete.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userToDelete.id));
        setUserToDelete(null);
      } else {
        alert("Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Edit Logic ---
  const handleEditClick = (user: User) => {
    setUserToEdit(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });
  };

  const handleEditSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userToEdit) return;

    setIsSubmitting(true);
    try {
      // Construct request body - we only update mutable fields
      const updateRequest = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email
      };

      const res = await fetch(`${API_IDENTITY}/users/${userToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateRequest)
      });

      if (res.ok) {
        const updatedUser = await res.json();
        // Update local state
        setUsers(users.map(u => u.id === userToEdit.id ? updatedUser : u));
        setUserToEdit(null);
      } else {
        alert("Failed to update user");
      }
    } catch (err) {
      console.error("Error updating user", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Users
        </h1>
        <p className="text-muted-foreground">
          Manage system users and access.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-sm text-left">
            <TableHeader className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs">
              <TableRow>
                <TableHead className="px-6 py-3">Name</TableHead>
                <TableHead className="px-6 py-3">Username</TableHead>
                <TableHead className="px-6 py-3">Email</TableHead>
                <TableHead className="px-6 py-3">Role</TableHead>
                <TableHead className="px-6 py-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No users found.</TableCell></TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="px-6 py-4 font-medium text-foreground">{u.firstName} {u.lastName}</TableCell>
                    <TableCell className="px-6 py-4">{u.username}</TableCell>
                    <TableCell className="px-6 py-4">{u.email}</TableCell>
                    <TableCell className="px-6 py-4">{u.role}</TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(u)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteClick(u)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Confirm Deletion"
        description="Are you sure you want to delete this user? This action cannot be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <div className="py-4">
          <p className="text-sm">
            You are about to delete user <strong>{userToDelete?.username}</strong>.
          </p>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!userToEdit}
        onClose={() => setUserToEdit(null)}
        title="Edit User"
        description="Update user details below."
        footer={
          <>
            <Button variant="outline" onClick={() => setUserToEdit(null)}>Cancel</Button>
            <Button onClick={() => handleEditSubmit()} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </>
        }
      >
        <form id="edit-user-form" onSubmit={handleEditSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={editFormData.firstName}
              onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={editFormData.lastName}
              onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={editFormData.email}
            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            required
          />
          {/* Username is read-only */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Username</label>
            <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-muted-foreground">
              {userToEdit?.username}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
