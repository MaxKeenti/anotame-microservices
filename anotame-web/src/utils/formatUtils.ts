export const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return "$0.00";
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(amount);
};

export const formatDate = (date: string | Date | undefined | null): string => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

export const formatDateTime = (date: string | Date | undefined | null): string => {
    if (!date) return "-";
    return new Date(date).toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};
