"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/Table";
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="p-4">ID</TableHead>
                                    <TableHead className="p-4">Nombre</TableHead>
                                    <TableHead className="p-4">Usuario</TableHead>
                                    <TableHead className="p-4">Rol</TableHead>
                                    <TableHead className="p-4">Correo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(u => (
                                    <TableRow key={u.id}>
                                        <TableCell className="p-4 font-mono text-xs text-muted-foreground">{u.id.substring(0, 8)}...</TableCell>
                                        <TableCell className="p-4">{u.firstName} {u.lastName}</TableCell>
                                        <TableCell className="p-4 font-bold">{u.username}</TableCell>
                                        <TableCell className="p-4">
                                            <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>
                                                {u.role === 'ADMIN' ? 'ADMINISTRADOR' : 'EMPLEADO'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="p-4 text-muted-foreground">{u.email}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
