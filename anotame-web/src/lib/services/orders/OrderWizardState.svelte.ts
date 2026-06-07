import { PersistedState } from 'runed';
import type { CreateOrderRequest, OrderItemDto } from '$lib/types/dtos';
import * as m from '$lib/paraglide/messages';

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

export interface PriceListInfo {
    id: string;
    name: string;
    items: Array<{
        serviceId: string;
        price: number;
    }>;
}

export interface DraftOrder extends Partial<Omit<CreateOrderRequest, 'items'>> {
    id: string;
    lastModified: number;
    currentStep: number;
    items?: DraftOrderItem[];
    amountPaid?: number;
    paymentMethod?: string;
    isEditing?: boolean; // Set to true if loaded from existing order ID
    priceListId?: string | null; // Price list selected at order creation
    priceListName?: string | null; // Denormalized name for display
    priceListItems?: Array<{ serviceId: string; price: number }>; // Cache for auto-fill
}

class OrderWizardState {
    // Organically persists to LocalStorage via Runed
    drafts = new PersistedState<DraftOrder[]>('anotame_drafts', []);

    // Currently active draft manipulated by the wizard views
    activeDraft = $state<DraftOrder | null>(null);

    get totalMinutes() {
        if (!this.activeDraft || !this.activeDraft.items) return 0;
        return this.activeDraft.items.reduce((total, item) => {
            const qty = item.quantity || 1;
            const itemMins = item.services.reduce((sum, s) => sum + (s.durationMin || 0), 0);
            return total + (itemMins * qty);
        }, 0);
    }

    loadDraft(id: string) {
        this.activeDraft = this.drafts.current.find((d: DraftOrder) => d.id === id) || null;
    }

    createEmptyDraft() {
        const id = typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            
        this.activeDraft = {
            id,
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

    /**
     * Completes the current draft by clearing the active state AND removing it from storage.
     * Should be called after a successful order creation.
     */
    completeActiveDraft() {
        if (this.activeDraft) {
            this.deleteDraft(this.activeDraft.id);
        }
        this.activeDraft = null;
    }

    /**
     * Sets the price list selection in the active draft.
     * @param id - Price list UUID (or null to clear)
     * @param name - Denormalized price list name for display
     * @param items - Array of {serviceId, price} for auto-fill lookups
     */
    setPriceList(id: string | null, name: string | null, items: Array<{ serviceId: string; price: number }> = []) {
        if (!this.activeDraft) return;
        this.activeDraft = {
            ...this.activeDraft,
            priceListId: id,
            priceListName: name,
            priceListItems: items
        };
        this.saveCurrentDraft();
    }

    /**
     * Clears the price list selection from the active draft.
     * Call this when the customer changes to reset price list.
     */
    clearPriceList() {
        if (!this.activeDraft) return;
        this.activeDraft = {
            ...this.activeDraft,
            priceListId: null,
            priceListName: null,
            priceListItems: []
        };
        this.saveCurrentDraft();
    }

    /**
     * Returns the currently selected price list info, or null if none selected.
     */
    getPriceList(): PriceListInfo | null {
        if (!this.activeDraft || !this.activeDraft.priceListId) {
            return null;
        }
        return {
            id: this.activeDraft.priceListId,
            name: this.activeDraft.priceListName || m['orders.noName'](),
            items: this.activeDraft.priceListItems || []
        };
    }
}

export const orderWizardState = new OrderWizardState();
