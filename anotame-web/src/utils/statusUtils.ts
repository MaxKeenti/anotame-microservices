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
    'PENDING': 'bg-warning/10 text-warning',
    'RECEIVED': 'bg-secondary text-secondary-foreground',
    'IN_PROGRESS': 'bg-warning/10 text-warning',
    'READY': 'bg-success/10 text-success',
    'DELIVERED': 'bg-secondary text-secondary-foreground',
    'CANCELLED': 'bg-destructive/10 text-destructive',
    'PAID': 'bg-success/10 text-success',
    'UNPAID': 'bg-destructive/10 text-destructive'
};

export function translateStatus(status: string): string {
    return STATUS_TRANSLATIONS[status] || status;
}

export function getStatusColor(status: string): string {
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
}
// Helper to map status to Badge variant
export function getBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
    switch (status) {
        case 'COMPLETED':
        case 'READY':
        case 'PAID':
            return 'success';
        case 'CANCELLED':
        case 'UNPAID':
            return 'destructive';
        case 'PENDING':
        case 'IN_PROGRESS':
            return 'warning';
        case 'RECEIVED':
        case 'DELIVERED':
            return 'secondary';
        default:
            return 'default';
    }
}
