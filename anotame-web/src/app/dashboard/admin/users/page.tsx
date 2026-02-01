"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { UserResponse, CreateUserRequest } from "@/types/dtos";
import * as UserService from "@/services/identity/users";

export default function EmployeesPage() {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState<CreateUserRequest>({
        username: "",
        email: "",
        firstName: "",
        lastName: "",
        role: "EMPLOYEE",
        password: ""
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await UserService.getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await UserService.createUser(formData);
            alert("User created successfully!");
            setShowForm(false);
            setFormData({ username: "", email: "", firstName: "", lastName: "", role: "EMPLOYEE", password: "" });
            loadData();
        } catch (err: any) {
            alert("Failed to create user: " + err.message);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gestión de Empleados</h1>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancelar" : "+ Agregar Empleado"}
                </Button>
            </div>

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Registrar Nuevo Empleado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Usuario"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Rol</label>
                                    <select
                                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="EMPLOYEE">Empleado</option>
                                        <option value="ADMIN">Administrador</option>
                                    </select>
                                </div>
                                <Input
                                    label="Nombre"
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Apellido"
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Correo"
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Contraseña"
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button type="submit">Crear Usuario</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center">Cargando...</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50">
                                <tr className="text-left">
                                    <th className="p-4 font-medium">ID</th>
                                    <th className="p-4 font-medium">Nombre</th>
                                    <th className="p-4 font-medium">Usuario</th>
                                    <th className="p-4 font-medium">Rol</th>
                                    <th className="p-4 font-medium">Correo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b hover:bg-muted/50">
                                        <td className="p-4 font-mono text-xs">{u.id.substring(0, 8)}...</td>
                                        <td className="p-4">{u.firstName} {u.lastName}</td>
                                        <td className="p-4 font-bold">{u.username}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{u.email}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
