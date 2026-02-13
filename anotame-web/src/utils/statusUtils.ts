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
    'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'RECEIVED': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'IN_PROGRESS': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'READY': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    'DELIVERED': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    'CANCELLED': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'PAID': 'bg-green-100 text-green-800',
    'UNPAID': 'bg-red-100 text-red-800'
};

export function translateStatus(status: string): string {
    return STATUS_TRANSLATIONS[status] || status;
}

export function getStatusColor(status: string): string {
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
}
