export const generateReceiptHtml = (data: {
  ticketNumber: string;
  customerName: string;
  phone: string;
  deadline: string;
  items: Array<{
    garment: string;
    service: string;
    notes?: string;
    price: number;
    adjustment?: number;
    adjustmentReason?: string;
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
  const date = new Date().toLocaleDateString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-MX', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket ${data.ticketNumber}</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: Arial, Helvetica, sans-serif; /* Better legibility for thermal */
      font-weight: 500; /* Slightly bolder */
      width: 40mm; /* Further reduced for safety */
      margin: 0 auto; /* Center it */
      padding: 0;
      font-size: 11px;
      line-height: 1.2;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 16px;
    }
    .section {
      margin-bottom: 10px;
      border-bottom: 1px dashed #000;
      padding-bottom: 5px;
    }
    /* Simple flex for alignment, but allow wrapping */
    .row {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap; 
    }
    .item {
      margin-bottom: 5px;
    }
    .item-header {
      font-weight: bold;
    }
    .item-detail {
        padding-left: 5px; /* Reduced padding */
    }
    .totals {
      text-align: right;
      font-size: 12px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 10px;
    }
    @media print {
      @page { size: auto; margin: 0mm; } 
      body { margin: 0 auto; padding: 1mm; width: 40mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.establishment.name}</h1>
    ${data.establishment.address ? `<div>${data.establishment.address}</div>` : ''}
    ${data.establishment.contactPhone ? `<div>Tel: ${data.establishment.contactPhone}</div>` : ''}
    ${data.establishment.rfc ? `<div>RFC: ${data.establishment.rfc}</div>` : ''}
    ${data.establishment.taxRegime ? `<div>Régimen: ${data.establishment.taxRegime}</div>` : ''}
    
    <div style="margin-top: 5px;">${date}</div>
    <div><strong>Folio: ${data.ticketNumber}</strong></div>
  </div>

  <div class="section">
    <div class="row">
      <span>Cliente:</span>
      <span style="text-align: right;">${data.customerName}</span>
    </div>
    <div class="row">
      <span>Tel:</span>
      <span>${data.phone || ''}</span>
    </div>
    <div class="row" style="margin-top: 5px; font-weight: bold;">
      <span>ENTREGA:</span>
      <span>${formatDate(data.deadline)}</span>
    </div>
    <div style="text-align: center; font-size: 10px; font-weight: normal; margin-top: 2px;">
      (Entrega después de las 18:00 hrs)
    </div>
  </div>

  <div class="section">
    ${data.items.map(item => `
      <div class="item">
        <div class="item-header row">
          <span style="flex: 1; margin-right: 5px;">${item.garment}</span>
          <span>$${item.price.toFixed(2)}</span>
        </div>
        <div class="item-detail">
          <div>+ ${item.service}</div>
          ${item.notes ? `<div><em>Nota: ${item.notes}</em></div>` : ''}
          ${item.adjustment ? `<div>Adj: $${item.adjustment} (${item.adjustmentReason})</div>` : ''}
        </div>
      </div>
    `).join('')}
  </div>

  <div class="section totals">
    <div class="row">
      <span>TOTAL:</span>
      <span>$${data.total.toFixed(2)}</span>
    </div>
    <div class="row">
      <span>ANTICIPO:</span>
      <span>$${data.amountPaid.toFixed(2)}</span>
    </div>
    <div class="row" style="font-size: 14px;">
      <span>RESTA:</span>
      <span>$${data.balance.toFixed(2)}</span>
    </div>
  </div>

  <div class="footer">
    <p>¡Gracias por su preferencia!</p>
    <p>No se entrega sin ticket.</p>
  </div>
</body>
</html>
  `;
};
