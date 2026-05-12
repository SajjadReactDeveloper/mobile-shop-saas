import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

export interface ReceiptItem {
  name: string
  qty: number
  unitPrice: number
}

export interface ReceiptData {
  shopName: string
  shopCity?: string
  invoiceNumber: string
  date: string
  items: ReceiptItem[]
  subtotal: number
  discount?: number
  total: number
  paymentMethod: string
  amountPaid: number
  customerName?: string
}

function fmt(n: number) {
  return `PKR ${n.toLocaleString('en-PK')}`
}

function buildHtml(r: ReceiptData): string {
  const itemRows = r.items
    .map(
      i => `
        <tr>
          <td style="padding:4px 0;font-size:13px">${i.name}</td>
          <td style="padding:4px 0;font-size:13px;text-align:center">${i.qty}</td>
          <td style="padding:4px 0;font-size:13px;text-align:right">${fmt(i.unitPrice)}</td>
          <td style="padding:4px 0;font-size:13px;text-align:right">${fmt(i.qty * i.unitPrice)}</td>
        </tr>`,
    )
    .join('')

  const change = r.amountPaid - r.total

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; padding: 16px; max-width: 300px; margin: 0 auto; color: #111; }
    .center { text-align: center; }
    .shop-name { font-size: 20px; font-weight: bold; margin-bottom: 2px; }
    .shop-city { font-size: 12px; color: #555; margin-bottom: 8px; }
    .divider { border-top: 1px dashed #999; margin: 8px 0; }
    .label { font-size: 11px; color: #777; }
    .invoice { font-size: 13px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    th { font-size: 11px; color: #777; text-align: left; padding: 4px 0; border-bottom: 1px solid #ddd; }
    th:nth-child(2) { text-align: center; }
    th:nth-child(3), th:nth-child(4) { text-align: right; }
    .total-row td { font-weight: bold; font-size: 14px; padding-top: 8px; }
    .thank-you { font-size: 12px; color: #555; margin-top: 10px; }
    .powered { font-size: 10px; color: #aaa; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="center">
    <div class="shop-name">${r.shopName}</div>
    ${r.shopCity ? `<div class="shop-city">${r.shopCity}</div>` : ''}
  </div>

  <div class="divider"></div>

  <div style="display:flex;justify-content:space-between;font-size:12px">
    <span class="label">Invoice: <span class="invoice">${r.invoiceNumber}</span></span>
    <span class="label">${r.date}</span>
  </div>
  ${r.customerName ? `<div style="font-size:12px;margin-top:2px">Customer: <b>${r.customerName}</b></div>` : ''}

  <div class="divider"></div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="divider"></div>

  <table>
    <tr>
      <td style="font-size:13px">Subtotal</td>
      <td style="font-size:13px;text-align:right">${fmt(r.subtotal)}</td>
    </tr>
    ${r.discount ? `<tr><td style="font-size:13px;color:#e53e3e">Discount</td><td style="font-size:13px;text-align:right;color:#e53e3e">-${fmt(r.discount)}</td></tr>` : ''}
    <tr class="total-row">
      <td>TOTAL</td>
      <td style="text-align:right">${fmt(r.total)}</td>
    </tr>
    <tr>
      <td style="font-size:12px;color:#555">Paid (${r.paymentMethod})</td>
      <td style="font-size:12px;text-align:right;color:#555">${fmt(r.amountPaid)}</td>
    </tr>
    ${change > 0 ? `<tr><td style="font-size:12px;color:#555">Change</td><td style="font-size:12px;text-align:right;color:#555">${fmt(change)}</td></tr>` : ''}
  </table>

  <div class="divider"></div>
  <div class="center thank-you">Thank you for shopping with us! 🙏</div>
  <div class="center powered">Powered by Mobile Shop</div>
</body>
</html>`
}

/** Print receipt to the default printer (PDF on most Android devices) */
export async function printReceipt(data: ReceiptData) {
  const html = buildHtml(data)
  await Print.printAsync({ html })
}

/** Generate PDF and open share sheet so user can WhatsApp/save it */
export async function shareReceipt(data: ReceiptData) {
  const html = buildHtml(data)
  const { uri } = await Print.printToFileAsync({ html })
  const canShare = await Sharing.isAvailableAsync()
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Receipt ${data.invoiceNumber}` })
  }
}
