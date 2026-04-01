"use client";

import { CustomerWizard } from "@/components/customers/CustomerWizard";

export default function NewCustomerPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 py-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-heading font-bold text-foreground">Nuevo Cliente</h1>
                <p className="text-muted-foreground mt-2">Complete la información para registrar un cliente.</p>
            </div>
            <CustomerWizard />
        </div>
    );
}
