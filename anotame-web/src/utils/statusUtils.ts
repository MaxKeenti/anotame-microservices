export const STATUS_TRANSLATIONS: Record<string, string> = {
    'PENDING': 'PENDIENTE',
    'RECEIVED': 'RECIBIDO',
    'IN_PROGRESS': 'EN PROGRESO',
    'READY': 'LISTO',
    'DELIVERED': 'ENTREGADO',
    'CANCELLED': 'CANCELADO',
    'PAID': 'PAGADO',
    'UNPAID': 'NO PAGADO'
};

export const STATUS_COLORS: Record<string, string> = {
    'PENDING': 'bg-warning-muted text-warning-text',
    'RECEIVED': 'bg-info-muted text-info-text',
    'IN_PROGRESS': 'bg-info-muted text-info-text',
    'READY': 'bg-success-muted text-success-text',
    'DELIVERED': 'bg-muted text-muted-foreground',
    'CANCELLED': 'bg-destructive-muted text-destructive-text',
    'PAID': 'bg-success-muted text-success-text',
    'UNPAID': 'bg-destructive-muted text-destructive-text'
};

export function translateStatus(status: string): string {
    return STATUS_TRANSLATIONS[status] || status;
}

export function getStatusColor(status: string): string {
    return STATUS_COLORS[status] || 'bg-muted text-muted-foreground';
}
