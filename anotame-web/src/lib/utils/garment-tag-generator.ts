import * as m from '$lib/paraglide/messages';
import { getLocale } from '$lib/paraglide/runtime';
import { escapeHtml } from '$lib/utils/html';

const localeMap: Record<string, string> = {
  es: 'es-MX',
  en: 'en-US',
};

function getIntlLocale(): string {
  return localeMap[getLocale()] ?? 'es-MX';
}

export interface GarmentTag {
  ticketNumber: string;
  /** 1-based position of the garment within the order. */
  itemIndex: number;
  itemCount: number;
  garmentName: string;
  customerName: string;
  phone?: string;
  deadline?: string | null;
  /** PNG data URL of the shared-ticket QR, omitted when the operator opts out. */
  qrDataUrl?: string;
}

/**
 * The last digits are enough for a human to disambiguate two same-name customers
 * without printing a full phone number on a tag that leaves the premises.
 */
function phoneTail(phone: string | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.length > 4 ? `…${digits.slice(-4)}` : digits;
}

function formatDeadline(deadline: string | null | undefined): string {
  if (!deadline) return '—';
  return new Date(deadline).toLocaleDateString(getIntlLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function renderTag(tag: GarmentTag, establishmentName: string): string {
  const tail = phoneTail(tag.phone);
  return `
  <div class="tag">
    <div class="brand">${escapeHtml(establishmentName)}</div>
    <div class="folio">${escapeHtml(tag.ticketNumber)}</div>
    <div class="position">${escapeHtml(m['garmentTag.position']({ index: tag.itemIndex, total: tag.itemCount }))}</div>
    <div class="customer">${escapeHtml(tag.customerName)}</div>
    ${tail ? `<div class="meta">${m['receipt.phone']()} ${escapeHtml(tail)}</div>` : ''}
    <div class="label">${m['garmentTag.delivery']()}</div>
    <div class="deadline">${escapeHtml(formatDeadline(tag.deadline))}</div>
    <div class="garment">${escapeHtml(tag.garmentName)}</div>
    ${tag.qrDataUrl ? `<img class="qr" src="${escapeHtml(tag.qrDataUrl)}" alt="" />` : ''}
  </div>`;
}

/**
 * Renders one printable label per garment for the 40mm thermal printer. Tags are
 * attached to the garment and to the client's handwritten embroidery format so
 * both carry the same folio, which is what ties the two together off-site.
 */
export const generateGarmentTagsHtml = (
  tags: GarmentTag[],
  establishmentName: string,
): string => `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(m['garmentTag.documentTitle']())}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      width: 40mm;
      margin: 0 auto;
      padding: 0;
      font-size: 11px;
      line-height: 1.25;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .tag {
      text-align: center;
      padding: 2mm 0 3mm;
      border-bottom: 1px dashed #000;
      page-break-after: always;
      break-after: page;
    }
    .tag:last-child { page-break-after: auto; break-after: auto; border-bottom: none; }
    .brand { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .folio {
      font-family: 'Courier New', monospace;
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 1px;
      margin-top: 1mm;
      /* The folio is the whole point of the tag; never let it break mid-number. */
      white-space: nowrap;
    }
    .position { font-size: 10px; margin-bottom: 1.5mm; }
    .customer { font-size: 13px; font-weight: bold; text-transform: uppercase; }
    .meta { font-size: 10px; }
    .label { font-size: 9px; letter-spacing: 1px; margin-top: 1.5mm; }
    .deadline { font-size: 15px; font-weight: bold; }
    .garment { font-size: 12px; margin-top: 1.5mm; }
    .qr { width: 28mm; height: 28mm; margin-top: 1.5mm; }
    @media print {
      @page { size: auto; margin: 0mm; }
      body { margin: 0 auto; padding: 1mm; width: 40mm; }
    }
  </style>
</head>
<body>
${tags.map((tag) => renderTag(tag, establishmentName)).join('\n')}
</body>
</html>`;
