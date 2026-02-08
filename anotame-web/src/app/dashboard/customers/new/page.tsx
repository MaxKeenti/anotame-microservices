"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CustomerForm } from "@/components/customers/CustomerForm";

export default function NewCustomerPage() {
    const router = useRouter();

    const handleSuccess = () => {
        // Navigate back to customers list
        router.push("/dashboard/customers");
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-heading font-bold text-foreground">Add New Customer</h1>
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <CustomerForm
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
