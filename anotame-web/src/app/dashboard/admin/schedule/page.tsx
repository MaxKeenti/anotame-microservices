"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { WorkDay, Holiday } from "@/types/dtos";
import * as ScheduleService from "@/services/operations/schedule";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SchedulePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"weekly" | "holidays">("weekly");
    const [isLoading, setIsLoading] = useState(true);

    const [workDays, setWorkDays] = useState<WorkDay[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);

    // New Holiday Form
    const [newHolidayDate, setNewHolidayDate] = useState("");
    const [newHolidayDesc, setNewHolidayDesc] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [days, hols] = await Promise.all([
                ScheduleService.getScheduleConfig(),
                ScheduleService.getHolidays()
            ]);
            // Ensure sorted by dayOfWeek
            setWorkDays(days.sort((a, b) => a.dayOfWeek - b.dayOfWeek));
            setHolidays(hols.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWorkDayChange = (index: number, field: keyof WorkDay, value: any) => {
        const updated = [...workDays];
        updated[index] = { ...updated[index], [field]: value };
        setWorkDays(updated);
    };

    const saveWeeklySchedule = async () => {
        setIsLoading(true);
        try {
            await ScheduleService.updateScheduleConfig(workDays);
            alert("Schedule updated successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to update schedule");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await ScheduleService.addHoliday(newHolidayDate, newHolidayDesc);
            setNewHolidayDate("");
            setNewHolidayDesc("");
            loadData(); // Reload list
        } catch (err) {
            alert("Failed to add holiday");
        }
    };

    const handleDeleteHoliday = async (id: string) => {
        if (!confirm("Delete holiday?")) return;
        try {
            await ScheduleService.deleteHoliday(id);
            loadData();
        } catch (err) {
            alert("Failed to delete holiday");
        }
    };

    if (isLoading && workDays.length === 0) return <div className="p-8">Cargando horario...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Horarios de Trabajo</h1>
            </div>

            <div className="flex gap-4 border-b border-border">
                <button
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'weekly' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                    onClick={() => setActiveTab('weekly')}
                >
                    Horario Semanal
                </button>
                <button
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'holidays' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                    onClick={() => setActiveTab('holidays')}
                >
                    Días Festivos y Excepciones
                </button>
            </div>

            {activeTab === 'weekly' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Horario de Apertura Estándar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            {workDays.map((day, index) => (
                                <div key={day.dayOfWeek} className="flex items-center gap-4 p-4 border rounded-lg bg-secondary/5">
                                    <div className="w-32 font-medium">
                                        {/* Simple translation mapping */}
                                        {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][day.dayOfWeek - 1]}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 border-gray-300 rounded"
                                            checked={day.open}
                                            onChange={(e) => handleWorkDayChange(index, 'open', e.target.checked)}
                                        />
                                        <span className={day.open ? "text-green-600 font-bold" : "text-gray-400"}>
                                            {day.open ? "Abierto" : "Cerrado"}
                                        </span>
                                    </div>

                                    {day.open && (
                                        <div className="flex items-center gap-2 ml-8">
                                            <Input
                                                type="time"
                                                value={day.openTime || "09:00"}
                                                onChange={(e) => handleWorkDayChange(index, 'openTime', e.target.value)}
                                                className="w-32"
                                            />
                                            <span>a</span>
                                            <Input
                                                type="time"
                                                value={day.closeTime || "18:00"}
                                                onChange={(e) => handleWorkDayChange(index, 'closeTime', e.target.value)}
                                                className="w-32"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={saveWeeklySchedule} disabled={isLoading}>
                                Guardar Cambios
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'holidays' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-1 h-fit">
                        <CardHeader>
                            <CardTitle>Agregar Día Festivo</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddHoliday} className="space-y-4">
                                <Input
                                    label="Fecha"
                                    type="date"
                                    required
                                    value={newHolidayDate}
                                    onChange={e => setNewHolidayDate(e.target.value)}
                                />
                                <Input
                                    label="Descripción"
                                    placeholder="ej. Navidad"
                                    required
                                    value={newHolidayDesc}
                                    onChange={e => setNewHolidayDesc(e.target.value)}
                                />
                                <Button type="submit" className="w-full">
                                    Agregar Excepción
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Próximos Días Festivos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {holidays.length === 0 ? (
                                <p className="text-muted-foreground">No hay días festivos configurados.</p>
                            ) : (
                                <div className="border rounded-md">
                                    <table className="w-full text-sm">
                                        <thead className="bg-secondary/20">
                                            <tr>
                                                <th className="p-3 text-left">Fecha</th>
                                                <th className="p-3 text-left">Descripción</th>
                                                <th className="p-3 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {holidays.map(h => (
                                                <tr key={h.id} className="border-t">
                                                    <td className="p-3 font-medium">
                                                        {new Date(h.date).toLocaleDateString(undefined, {
                                                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="p-3">{h.description}</td>
                                                    <td className="p-3 text-right">
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => h.id && handleDeleteHoliday(h.id)}
                                                        >
                                                            Eliminar
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
