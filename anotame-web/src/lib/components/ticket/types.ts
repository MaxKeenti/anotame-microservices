/**
 * Presentation shapes shared by the two public ticket routes.
 *
 * A handling ticket (`/g/[token]`) omits prices, so the money fields are optional
 * here and both `PublicTicketResponse` and `PublicHandlingTicketResponse` items
 * satisfy this contract.
 */
export type TicketService = {
	serviceName: string;
	instructions?: string | null;
	unitPrice?: number;
	adjustmentAmount?: number;
};

export type TicketItem = {
	garmentName: string;
	quantity: number;
	notes?: string | null;
	services: TicketService[];
};
