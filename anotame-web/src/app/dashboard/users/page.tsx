"use client";

import { useEffect, useState } from "react";
import { API_IDENTITY } from "@/lib/api";
import { User } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuth();

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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
        const res = await fetch(`${API_IDENTITY}/users/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            setUsers(users.filter(u => u.id !== id));
        } else {
            alert("Failed to delete user");
        }
    } catch (err) {
        console.error("Error deleting user", err);
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
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Username</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No users found.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{u.firstName} {u.lastName}</td>
                    <td className="px-6 py-4">{u.username}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">{u.role}</td>
                    <td className="px-6 py-4 text-right">
                        <button 
                            onClick={() => handleDelete(u.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-semibold px-3 py-1 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                        >
                            Delete
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
