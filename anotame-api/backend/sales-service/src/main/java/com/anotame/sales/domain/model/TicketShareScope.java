package com.anotame.sales.domain.model;

/**
 * Audience a ticket share link was minted for. A link resolves only on the
 * endpoint matching its scope, so widening what a token can read requires
 * minting a new one rather than calling a different URL with the same token.
 */
public enum TicketShareScope {
    /** Full public receipt for the client, including the active pickup code. */
    CUSTOMER,
    /** Garment-handling view: what and whose, never the pickup code or amounts. */
    HANDLING
}
