"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { UserResponse } from "@/types/dtos";
import * as UserService from "@/services/identity/users";
import { EmployeeWizard } from "@/components/users/EmployeeWizard";

export default function EmployeesPage() {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

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
                        <EmployeeWizard
                            onSuccess={() => {
                                alert("Usuario creado correctamente!");
                                setShowForm(false);
                                loadData();
                            }}
                            onCancel={() => setShowForm(false)}
                        />
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
