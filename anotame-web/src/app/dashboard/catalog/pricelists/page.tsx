"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/Table";
import { getPriceLists, deletePriceList } from "@/services/catalog/pricelists";
import { PriceListResponse } from "@/types/dtos";

import { useAuth } from "@/context/AuthContext";

export default function PriceListsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [lists, setLists] = useState<PriceListResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadLists();
    }, []);

    const loadLists = async () => {
        try {
            const data = await getPriceLists();
            setLists(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this price list?")) return;
        try {
            await deletePriceList(id);
            loadLists();
        } catch (err) {
            alert("Failed to delete");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Listas de Precios</h1>
                {isAdmin && (
                    <Button onClick={() => router.push("/dashboard/catalog/pricelists/new")}>
                        + Nueva Lista
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Estrategias de Precios Activas</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div>Cargando...</div>
                    ) : lists.length === 0 ? (
                        <div className="text-muted-foreground">No se encontraron listas de precios.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="p-4">Nombre</TableHead>
                                    <TableHead className="p-4">Prioridad</TableHead>
                                    <TableHead className="p-4">Válido Desde</TableHead>
                                    <TableHead className="p-4">Válido Hasta</TableHead>
                                    <TableHead className="p-4">Estado</TableHead>
                                    {isAdmin && <TableHead className="p-4 text-right">Acciones</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lists.map((list) => (
                                    <TableRow key={list.id} className="border-b last:border-0 hover:bg-secondary/10">
                                        <TableCell className="p-4 font-medium">{list.name}</TableCell>
                                        <TableCell className="p-4">{list.priority}</TableCell>
                                        <TableCell className="p-4">{new Date(list.validFrom).toLocaleDateString()}</TableCell>
                                        <TableCell className="p-4">
                                            {list.validTo ? new Date(list.validTo).toLocaleDateString() : "Permanente"}
                                        </TableCell>
                                        <TableCell className="p-4">
                                            {list.active ? (
                                                <span className="text-green-600 font-bold">Activa</span>
                                            ) : (
                                                <span className="text-gray-500">Inactiva</span>
                                            )}
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell className="p-4 text-right space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/dashboard/catalog/pricelists/${list.id}`)}
                                                >
                                                    Ver
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(list.id)}
                                                >
                                                    Eliminar
                                                </Button>
                                            </TableCell>
                                        )}
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
