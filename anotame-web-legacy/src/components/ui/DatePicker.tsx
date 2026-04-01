"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";

interface DatePickerProps {
    value?: Date | string;
    onChange: (date: Date) => void;
    label?: string;
    placeholder?: string;
    minDate?: Date;
    className?: string;
}

export function DatePicker({ value, onChange, label, placeholder = "Seleccionar fecha", minDate, className }: DatePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Parse initial value or default to today for calendar view
    const validDate = React.useMemo(() => {
        if (!value) return null;
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }, [value]);

    const [viewDate, setViewDate] = React.useState(validDate || new Date());

    // Generate days for the current month view
    const daysInMonth = React.useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const date = new Date(year, month, 1);
        const days = [];

        // Fill previous month days to align grid
        const firstDayOfWeek = date.getDay(); // 0 (Sun) - 6 (Sat)
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }

        // Fill current month days
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }

        return days;
    }, [viewDate]);

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleSelectDate = (date: Date) => {
        // preserve current time if needed, but usually for deadline we just want the date
        // Let's set it to noon to avoid timezone issues for now
        const newDate = new Date(date);
        newDate.setHours(12, 0, 0, 0);
        onChange(newDate);
        setIsOpen(false);
    };

    const handleQuickSelect = (daysToAdd: number) => {
        const d = new Date();
        d.setDate(d.getDate() + daysToAdd);
        handleSelectDate(d);
    };

    // Format for display input
    const displayValue = validDate ? validDate.toLocaleDateString('es-MX', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }) : "";

    const monthName = viewDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

    return (
        <div className={`relative ${className}`}>
            {label && <label className="text-sm font-medium mb-2 block">{label}</label>}

            {/* Input Trigger */}
            <div
                className="relative cursor-pointer"
                onClick={() => setIsOpen(true)}
            >
                <Input
                    readOnly
                    value={displayValue}
                    placeholder={placeholder}
                    className="cursor-pointer font-medium hover:bg-accent/50 transition-colors"
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Modal / Popover */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Calendar Container */}
                    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-xl shadow-lg w-[90vw] max-w-md p-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold capitalize text-foreground">{monthName}</h3>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Quick Select Buttons */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <Button variant="outline" size="sm" onClick={() => handleQuickSelect(0)}>
                                Hoy
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleQuickSelect(1)}>
                                Mañana
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleQuickSelect(3)}>
                                En 3 días
                            </Button>
                        </div>

                        {/* Days Header */}
                        <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-muted-foreground uppercase">
                            <div>Dom</div>
                            <div>Lun</div>
                            <div>Mar</div>
                            <div>Mié</div>
                            <div>Jue</div>
                            <div>Vie</div>
                            <div>Sáb</div>
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {daysInMonth.map((date, i) => {
                                if (!date) return <div key={`empty-${i}`} className="h-12" />; // Empty slot

                                const isSelected = validDate?.getDate() === date.getDate() &&
                                    validDate?.getMonth() === date.getMonth() &&
                                    validDate?.getFullYear() === date.getFullYear();

                                const isToday = new Date().toDateString() === date.toDateString();
                                const isDisabled = minDate && date < new Date(minDate.setHours(0, 0, 0, 0));

                                return (
                                    <button
                                        key={i}
                                        onClick={() => !isDisabled && handleSelectDate(date)}
                                        disabled={!!isDisabled}
                                        className={`
                                            h-12 rounded-lg flex items-center justify-center font-medium text-lg transition-all
                                            ${isSelected
                                                ? "bg-primary text-primary-foreground shadow-md scale-105"
                                                : "hover:bg-accent text-foreground hover:text-accent-foreground"
                                            }
                                            ${isToday && !isSelected ? "border border-primary text-primary" : ""}
                                            ${isDisabled ? "opacity-30 cursor-not-allowed" : "active:scale-95"}
                                        `}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
