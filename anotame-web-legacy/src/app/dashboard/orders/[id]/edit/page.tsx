import { OrderWizard } from "@/components/orders/OrderWizard";

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <OrderWizard orderId={id} />;
}
