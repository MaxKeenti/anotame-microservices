import { getLocale } from '$lib/paraglide/runtime';

const localeMap: Record<string, string> = {
    es: 'es-MX',
    en: 'en-US',
};

/** BCP 47 tag for the active Paraglide locale, for Intl formatting. */
export function getIntlLocale(): string {
    return localeMap[getLocale()] ?? 'es-MX';
}

export const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return "$0.00";
    return new Intl.NumberFormat(getIntlLocale(), {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(amount);
};

/** Epoch millis for sorting date columns by value; undefined when there is no date. */
export const toTimestamp = (date: string | Date | undefined | null): number | undefined => {
    if (!date) return undefined;
    const ms = new Date(date).getTime();
    return Number.isNaN(ms) ? undefined : ms;
};

export const formatDate = (date: string | number | Date | undefined | null): string => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(getIntlLocale(), {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

export const formatDateTime = (date: string | Date | undefined | null): string => {
    if (!date) return "-";
    return new Date(date).toLocaleString(getIntlLocale(), {
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};
