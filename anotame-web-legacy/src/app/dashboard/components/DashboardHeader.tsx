"use client";

import { useEffect, useState } from "react";
import { getAllOrders } from "@/services/sales/orders";
import { OrderResponse } from "@/types/dtos";
import { Clock, CalendarCheck, CheckCircle2 } from "lucide-react";

export function DashboardHeader() {
    const [stats, setStats] = useState({
        dueToday: 0,
        receivedToday: 0,
    });
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const orders: OrderResponse[] = await getAllOrders();
                const today = new Date().toISOString().split("T")[0];

                const dueToday = orders.filter((o) => {
                    if (!o.committedDeadline) return false;
                    const deadline = o.committedDeadline.split("T")[0];
                    const isPending = o.status !== "DELIVERED" && o.status !== "CANCELLED";
                    return deadline === today && isPending;
                }).length;

                const receivedToday = orders.filter((o) => {
                    const created = o.createdAt.split("T")[0];
                    return created === today;
                }).length;

                setStats({ dueToday, receivedToday });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };

        fetchStats();
    }, []);

    const formattedDate = currentDate.toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const formattedTime = currentDate.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-card border border-border rounded-xl p-6 shadow-sm">
            <div>
                <h1 className="text-3xl font-heading font-bold text-foreground">
                    Inicio
                </h1>
                <p className="text-muted-foreground flex items-center gap-2 mt-2 capitalize" suppressHydrationWarning>
                    <Clock className="w-4 h-4" />
                    {formattedDate} • {formattedTime}
                </p>
            </div>

            <div className="flex gap-4">
                <div className="flex flex-col items-end px-4 py-2 bg-primary/5 rounded-lg border border-primary/10">
                    <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                        Para Hoy <CalendarCheck className="w-4 h-4 text-primary" />
                    </span>
                    <span className="text-2xl font-bold text-primary">
                        {stats.dueToday}
                    </span>
                </div>

                <div className="flex flex-col items-end px-4 py-2 bg-secondary/30 rounded-lg border border-secondary">
                    <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                        Recibidos <CheckCircle2 className="w-4 h-4 text-secondary-foreground" />
                    </span>
                    <span className="text-2xl font-bold text-foreground">
                        {stats.receivedToday}
                    </span>
                </div>
            </div>
        </div>
    );
}
