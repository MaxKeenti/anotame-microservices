import { CreateOrderRequest, OrderItemDto } from "@/types/dtos";

export interface DraftOrderItem extends Partial<OrderItemDto> {
    garmentId?: string; // Used in wizard before mapping to garmentTypeId
    garmentName?: string;
    services: Array<{
        serviceId: string;
        serviceName: string;
        unitPrice: number;
        adjustmentAmount?: number;
        adjustmentReason?: string;
    }>;
    notes?: string;
}

export interface DraftOrder extends Partial<Omit<CreateOrderRequest, 'items'>> {
    id: string; // Local Unique ID
    lastModified: number;
    currentStep: number; // 0=Customer, 1=Items, 2=Payment
    items?: DraftOrderItem[];
    amountPaid?: number;
    paymentMethod?: string;
}

const STORAGE_KEY = 'anotame_drafts';

export const DraftsService = {
    getAll: (): DraftOrder[] => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to load drafts", e);
            return [];
        }
    },

    get: (id: string): DraftOrder | undefined => {
        const drafts = DraftsService.getAll();
        return drafts.find(d => d.id === id);
    },

    save: (draft: DraftOrder) => {
        if (typeof window === 'undefined') return;
        try {
            const drafts = DraftsService.getAll();
            const index = drafts.findIndex(d => d.id === draft.id);
            const updatedDraft = { ...draft, lastModified: Date.now() };

            if (index >= 0) {
                drafts[index] = updatedDraft;
            } else {
                drafts.push(updatedDraft);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
        } catch (e) {
            console.error("Failed to save draft", e);
        }
    },

    delete: (id: string) => {
        if (typeof window === 'undefined') return;
        try {
            const drafts = DraftsService.getAll().filter(d => d.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
        } catch (e) {
            console.error("Failed to delete draft", e);
        }
    },

    clearAll: () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(STORAGE_KEY);
    }
};
