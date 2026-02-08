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
    body {
      font-family: 'Courier New', Courier, monospace;
      width: 80mm;
      margin: 0;
      padding: 5px;
      font-size: 12px;
      line-height: 1.2;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 18px;
    }
    .section {
      margin-bottom: 10px;
      border-bottom: 1px dashed #000;
      padding-bottom: 5px;
    }
    .row {
      display: flex;
      justify-content: space-between;
    }
    .item {
      margin-bottom: 5px;
    }
    .item-header {
      font-weight: bold;
    }
    .item-detail {
        padding-left: 10px;
    }
    .totals {
      text-align: right;
      font-size: 14px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 10px;
    }
    @media print {
      @page { margin: 0; }
      body { margin: 0; padding: 2mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.establishment.name}</h1>
    ${data.establishment.address ? `<div>${data.establishment.address}</div>` : ''}
    ${data.establishment.rfc ? `<div>RFC: ${data.establishment.rfc}</div>` : ''}
    <div>${date}</div>
    <div><strong>Folio: ${data.ticketNumber}</strong></div>
  </div>

  <div class="section">
    <div class="row">
      <span>Cliente:</span>
      <span>${data.customerName}</span>
    </div>
    <div class="row">
      <span>Tel:</span>
      <span>${data.phone}</span>
    </div>
    <div class="row" style="margin-top: 5px; font-weight: bold;">
      <span>ENTREGA:</span>
      <span>${formatDate(data.deadline)}</span>
    </div>
  </div>

  <div class="section">
    ${data.items.map(item => `
      <div class="item">
        <div class="item-header row">
          <span>${item.garment}</span>
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
    <div class="row" style="font-size: 16px;">
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
