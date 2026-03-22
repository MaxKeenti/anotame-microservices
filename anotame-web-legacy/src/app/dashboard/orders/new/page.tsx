"use client";

import { useSearchParams } from "next/navigation";
import { OrderWizard } from "@/components/orders/OrderWizard";
import { Suspense } from "react";

function NewOrderContent() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId") || undefined;

  return <OrderWizard initialDraftId={draftId} />;
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Cargando...</div>}>
      <NewOrderContent />
    </Suspense>
  );
}
