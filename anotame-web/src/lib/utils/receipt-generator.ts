import * as m from '$lib/paraglide/messages';
import { getLocale } from '$lib/paraglide/runtime';

const localeMap: Record<string, string> = {
  es: 'es-MX',
  en: 'en-US',
};

function getIntlLocale(): string {
  return localeMap[getLocale()] ?? 'es-MX';
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export const generateReceiptHtml = (data: {
  ticketNumber: string;
  customerName: string;
  phone: string;
  deadline: string;
  pickupCode?: string;
  items: Array<{
    garment: string;
    services: Array<{
      name: string;
      price: number;
      adjustment?: number;
      adjustmentReason?: string;
      instructions?: string;
    }>;
    notes?: string;
  }>;
  balance: number;
  total: number;
  amountPaid: number;
  establishment: {
    name: string;
    address?: string;
    rfc?: string;
    taxRegime?: string;
    contactPhone?: string;
  };
}) => {
  const intlLocale = getIntlLocale();

  const date = new Date().toLocaleDateString(intlLocale, {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString(intlLocale, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(m["receipt.ticketTitle"]({ ticket: data.ticketNumber }))}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-weight: 500;
      width: 40mm;
      margin: 0 auto;
      padding: 0;
      font-size: 11px;
      line-height: 1.2;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .header { text-align: center; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 16px; }
    .section { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
    .row { display: flex; justify-content: space-between; flex-wrap: wrap; }
    .item { margin-bottom: 5px; }
    .item-header { font-weight: bold; }
    .item-detail { padding-left: 5px; }
    .totals { text-align: right; font-size: 12px; font-weight: bold; }
    .footer { text-align: center; margin-top: 20px; font-size: 10px; }
    @media print {
      @page { size: auto; margin: 0mm; }
      body { margin: 0 auto; padding: 1mm; width: 40mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(data.establishment.name)}</h1>
    ${data.establishment.address ? `<div>${escapeHtml(data.establishment.address)}</div>` : ''}
    ${data.establishment.contactPhone ? `<div>${m["receipt.phone"]()}: ${escapeHtml(data.establishment.contactPhone)}</div>` : ''}
    ${data.establishment.rfc ? `<div>RFC: ${escapeHtml(data.establishment.rfc)}</div>` : ''}
    ${data.establishment.taxRegime ? `<div>${m["receipt.taxRegime"]()}: ${escapeHtml(data.establishment.taxRegime)}</div>` : ''}

    <div style="margin-top: 5px;">${date}</div>
    <div><strong>${m["receipt.folio"]()}: ${escapeHtml(data.ticketNumber)}</strong></div>
  </div>

  <div class="section">
    <div class="row"><span>${m["receipt.customer"]()}:</span><span style="text-align: right;">${escapeHtml(data.customerName)}</span></div>
    <div class="row"><span>${m["receipt.phone"]()}:</span><span>${escapeHtml(data.phone)}</span></div>
    <div class="row" style="margin-top: 5px; font-weight: bold;"><span>${m["receipt.delivery"]()}:</span><span>${escapeHtml(formatDate(data.deadline))}</span></div>
    <div style="text-align: center; font-size: 10px; font-weight: normal; margin-top: 2px;">${m["receipt.deliveryNote"]()}</div>
  </div>

  <div class="section">
    ${data.items.map(item => `
      <div class="item">
        <div class="item-header row"><span style="font-weight: bold;">${escapeHtml(item.garment)}</span></div>
        ${item.services.map(service => `
            <div class="row" style="padding-left: 5px;">
                <span style="flex: 1; margin-right: 2px;">+ ${escapeHtml(service.name)}</span>
                <span>$${(service.price + (service.adjustment || 0)).toFixed(2)}</span>
            </div>
            ${service.adjustment ? `<div style="padding-left: 10px; font-size: 10px; font-style: italic;">${m["receipt.adjustment"]()}: ${service.adjustment > 0 ? '+' : ''}${service.adjustment} (${escapeHtml(service.adjustmentReason)})</div>` : ''}
            ${service.instructions ? `<div class="item-detail">${escapeHtml(service.instructions)}</div>` : ''}
        `).join('')}
        ${item.notes ? `<div class="item-detail" style="font-style: italic;">${m["receipt.note"]()}: ${escapeHtml(item.notes)}</div>` : ''}
      </div>
    `).join('')}
  </div>

  <div class="section totals">
    <div class="row">
      <span>${m["receipt.total"]()}:</span>
      <span>$${data.total.toFixed(2)}</span>
    </div>
    <div class="row">
      <span>${m["receipt.deposit"]()}:</span>
      <span>$${data.amountPaid.toFixed(2)}</span>
    </div>
    <div class="row" style="font-size: 14px;">
      <span>${m["receipt.remaining"]()}:</span>
      <span>$${data.balance.toFixed(2)}</span>
    </div>
  </div>

   ${data.pickupCode ? `
   <div class="section" style="text-align: center;">
     <div style="font-size: 10px; font-weight: normal; margin-bottom: 5px;">${m["receipt.pickupCode"]()}</div>
     <div style="font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold; letter-spacing: 2px; text-align: center;">${escapeHtml(data.pickupCode)}</div>
   </div>
   ` : ""}


  <div class="footer">
    <p>${m["receipt.thankYou"]()}</p>
    <p>${m["receipt.noTicketNoDelivery"]()}</p>
  </div>
</body>
</html>
  `;
};
