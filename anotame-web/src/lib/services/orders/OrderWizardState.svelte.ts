import { PersistedState } from 'runed';
import type { CreateOrderRequest, OrderItemDto } from '$lib/types/dtos';

export interface DraftOrderItem extends Partial<OrderItemDto> {
    garmentId?: string; // Used in wizard before mapping to garmentTypeId
    garmentName?: string;
    services: Array<{
        serviceId: string;
        serviceName: string;
        unitPrice: number;
        durationMin: number;
        adjustmentAmount?: number;
        adjustmentReason?: string;
    }>;
    notes?: string;
}

export interface DraftOrder extends Partial<Omit<CreateOrderRequest, 'items'>> {
    id: string;
    lastModified: number;
    currentStep: number;
    items?: DraftOrderItem[];
    amountPaid?: number;
    paymentMethod?: string;
    isEditing?: boolean; // Set to true if loaded from existing order ID
}

class OrderWizardState {
    // Organically persists to LocalStorage via Runed
    drafts = new PersistedState<DraftOrder[]>('anotame_drafts', []);

    // Currently active draft manipulated by the wizard views
    activeDraft = $state<DraftOrder | null>(null);

    totalMinutes = $derived.by(() => {
        if (!this.activeDraft || !this.activeDraft.items) return 0;
        return this.activeDraft.items.reduce((total, item) => {
            const qty = item.quantity || 1;
            const itemMins = item.services.reduce((sum, s) => sum + (s.durationMin || 0), 0);
            return total + (itemMins * qty);
        }, 0);
    });

    loadDraft(id: string) {
        this.activeDraft = this.drafts.current.find((d: DraftOrder) => d.id === id) || null;
    }

    createEmptyDraft() {
        this.activeDraft = {
            id: crypto.randomUUID(),
            lastModified: Date.now(),
            currentStep: 0,
            items: [],
            amountPaid: 0,
            paymentMethod: 'CASH'
        };
    }

    saveCurrentDraft() {
        if (!this.activeDraft || this.activeDraft.isEditing) return;

        let currentDrafts = [...this.drafts.current];
        const index = currentDrafts.findIndex((d: DraftOrder) => d.id === this.activeDraft!.id);
        const updated = { ...this.activeDraft, lastModified: Date.now() };

        if (index >= 0) {
            currentDrafts[index] = updated;
        } else {
            currentDrafts.push(updated);
        }

        // Save back to local storage
        this.drafts.current = currentDrafts;
        this.activeDraft = updated;
    }

    updateActiveDraft(updates: Partial<DraftOrder>) {
        if (!this.activeDraft) return;
        this.activeDraft = { ...this.activeDraft, ...updates };
        this.saveCurrentDraft();
    }

    deleteDraft(id: string) {
        this.drafts.current = this.drafts.current.filter((d: DraftOrder) => d.id !== id);
        if (this.activeDraft?.id === id) {
            this.activeDraft = null;
        }
    }

    clearActiveDraft() {
        this.activeDraft = null;
    }
}

export const orderWizardState = new OrderWizardState();
