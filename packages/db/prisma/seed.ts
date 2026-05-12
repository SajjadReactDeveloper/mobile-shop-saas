/**
 * Demo seed — creates one fully-populated demo shop
 *
 * Email:    demo@mobileshop.pk
 * Password: Demo1234!
 *
 * Run:  pnpm --filter @repo/db db:seed
 */

import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Pre-computed bcrypt hash of "Demo1234!" (cost 10).
 * Using a literal avoids adding bcryptjs as a db-package dependency.
 * All demo users share this password.
 */
const DEMO_PASSWORD_HASH = '$2b$10$EhZUtnoOHhljrV8coyeddeI1bLoaX5.zaldYZBr9FhSsyJwj8sFGS'
function hashPassword(_plain: string): string { return DEMO_PASSWORD_HASH }

/** Returns a Date N days ago at a random time during business hours */
function daysAgo(n: number, hourMin = 9, hourMax = 21): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(Math.floor(Math.random() * (hourMax - hourMin)) + hourMin,
             Math.floor(Math.random() * 60), 0, 0)
  return d
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function dec(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n)
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding demo data…')

  // ── 0. clean up any previous demo data ────────────────────────────────────
  const existing = await prisma.shop.findFirst({ where: { name: 'Demo Mobile Shop' } })
  if (existing) {
    console.log('   Removing previous demo shop…')
    const sid = existing.id
    // Must delete in FK dependency order (leaf nodes first)
    await prisma.cashExpense.deleteMany({ where: { cashRegister: { shopId: sid } } })
    await prisma.cashRegister.deleteMany({ where: { shopId: sid } })
    await prisma.ledgerEntry.deleteMany({ where: { customer: { shopId: sid } } })
    await prisma.repairPart.deleteMany({ where: { job: { shopId: sid } } })
    await prisma.repairJob.deleteMany({ where: { shopId: sid } })
    await prisma.saleItem.deleteMany({ where: { sale: { shopId: sid } } })
    await prisma.imeiLog.deleteMany({ where: { product: { shopId: sid } } })
    await prisma.sale.deleteMany({ where: { shopId: sid } })
    await prisma.purchaseItem.deleteMany({ where: { purchase: { shopId: sid } } })
    await prisma.purchase.deleteMany({ where: { shopId: sid } })
    await prisma.easyLoadTxn.deleteMany({ where: { account: { shopId: sid } } })
    await prisma.easyLoadAccount.deleteMany({ where: { shopId: sid } })
    await prisma.easypaisaTxn.deleteMany({ where: { account: { shopId: sid } } })
    await prisma.easypaisaAccount.deleteMany({ where: { shopId: sid } })
    await prisma.product.deleteMany({ where: { shopId: sid } })
    await prisma.customer.deleteMany({ where: { shopId: sid } })
    await prisma.subscription.deleteMany({ where: { shopId: sid } })
    await prisma.user.deleteMany({ where: { shopId: sid } })
    await prisma.shop.delete({ where: { id: sid } })
  }

  // ── 1. Shop ────────────────────────────────────────────────────────────────
  const shop = await prisma.shop.create({
    data: {
      name: 'Demo Mobile Shop',
      city: 'Lahore',
      address: 'Shop #14, Hafeez Centre, Lahore',
      phone: '03001234567',
    },
  })
  console.log(`   ✓ Shop: ${shop.name}`)

  // ── 2. Subscription (PRO trial) ────────────────────────────────────────────
  await prisma.subscription.create({
    data: {
      shopId: shop.id,
      tier: 'PRO',
      status: 'TRIALING',
      trialEndsAt: new Date(Date.now() + 14 * 86400 * 1000),
    },
  })

  // ── 3. Owner user ──────────────────────────────────────────────────────────
  // NOTE: password hashed here is just for seed display.
  // The API uses bcrypt; to log in use the /auth/register or the pre-created creds below.
  const owner = await prisma.user.create({
    data: {
      shopId: shop.id,
      name: 'Ahmed Khan',
      email: 'demo@mobileshop.pk',
      passwordHash: hashPassword('Demo1234!'),
      role: 'OWNER',
      phone: '03001234567',
      provider: 'EMAIL',
    },
  })
  console.log(`   ✓ Owner: ${owner.email}`)

  // Cashier
  await prisma.user.create({
    data: {
      shopId: shop.id,
      name: 'Bilal Raza',
      email: 'cashier@mobileshop.pk',
      passwordHash: hashPassword('Demo1234!'),
      role: 'CASHIER',
      phone: '03111234567',
      provider: 'EMAIL',
    },
  })

  // Technician
  const tech = await prisma.user.create({
    data: {
      shopId: shop.id,
      name: 'Usman Ali',
      email: 'tech@mobileshop.pk',
      passwordHash: hashPassword('Demo1234!'),
      role: 'TECHNICIAN',
      phone: '03211234567',
      provider: 'EMAIL',
    },
  })

  // ── 4. Products ────────────────────────────────────────────────────────────
  const products = await Promise.all([
    // Mobiles (IMEI tracked)
    prisma.product.create({ data: { shopId: shop.id, name: 'Samsung Galaxy A15', brand: 'Samsung', category: 'MOBILE', buyingPrice: dec(38000), sellingPrice: dec(44000), stockQty: 8,  imeiTracked: true,  lowStockAlert: 2 } }),
    prisma.product.create({ data: { shopId: shop.id, name: 'iPhone 14',          brand: 'Apple',   category: 'MOBILE', buyingPrice: dec(185000), sellingPrice: dec(205000), stockQty: 3, imeiTracked: true, lowStockAlert: 1 } }),
    prisma.product.create({ data: { shopId: shop.id, name: 'Tecno Spark 20',     brand: 'Tecno',   category: 'MOBILE', buyingPrice: dec(28000), sellingPrice: dec(32000), stockQty: 12, imeiTracked: true, lowStockAlert: 3 } }),
    prisma.product.create({ data: { shopId: shop.id, name: 'Vivo Y18',           brand: 'Vivo',    category: 'MOBILE', buyingPrice: dec(33000), sellingPrice: dec(38000), stockQty: 6,  imeiTracked: true, lowStockAlert: 2 } }),
    prisma.product.create({ data: { shopId: shop.id, name: 'Oppo A78',           brand: 'Oppo',    category: 'MOBILE', buyingPrice: dec(42000), sellingPrice: dec(48000), stockQty: 5,  imeiTracked: true, lowStockAlert: 2 } }),

    // Accessories
    prisma.product.create({ data: { shopId: shop.id, name: 'Tempered Glass (Universal)',  brand: null, category: 'ACCESSORY', buyingPrice: dec(60),   sellingPrice: dec(150),  stockQty: 200, imeiTracked: false, lowStockAlert: 20 } }),
    prisma.product.create({ data: { shopId: shop.id, name: 'Mobile Cover Samsung A15',    brand: null, category: 'ACCESSORY', buyingPrice: dec(80),   sellingPrice: dec(200),  stockQty: 150, imeiTracked: false, lowStockAlert: 20 } }),
    prisma.product.create({ data: { shopId: shop.id, name: 'Airpods (Clone)',              brand: null, category: 'ACCESSORY', buyingPrice: dec(350),  sellingPrice: dec(800),  stockQty: 40,  imeiTracked: false, lowStockAlert: 5  } }),
    prisma.product.create({ data: { shopId: shop.id, name: 'USB-C Data Cable 2m',         brand: null, category: 'ACCESSORY', buyingPrice: dec(120),  sellingPrice: dec(250),  stockQty: 80,  imeiTracked: false, lowStockAlert: 10 } }),

    // Chargers
    prisma.product.create({ data: { shopId: shop.id, name: 'Samsung 25W Fast Charger',   brand: 'Samsung', category: 'CHARGER', buyingPrice: dec(900),  sellingPrice: dec(1400), stockQty: 25, imeiTracked: false, lowStockAlert: 5 } }),
    prisma.product.create({ data: { shopId: shop.id, name: 'iPhone 20W Adapter',          brand: 'Apple',   category: 'CHARGER', buyingPrice: dec(1100), sellingPrice: dec(1800), stockQty: 15, imeiTracked: false, lowStockAlert: 3 } }),

    // Spare parts
    prisma.product.create({ data: { shopId: shop.id, name: 'Samsung A15 Display',         brand: 'Samsung', category: 'SPARE_PART', buyingPrice: dec(3200), sellingPrice: dec(4500), stockQty: 8, imeiTracked: false, lowStockAlert: 2 } }),
    prisma.product.create({ data: { shopId: shop.id, name: 'iPhone 14 Battery',           brand: 'Apple',   category: 'SPARE_PART', buyingPrice: dec(4500), sellingPrice: dec(6500), stockQty: 5, imeiTracked: false, lowStockAlert: 2 } }),
    prisma.product.create({ data: { shopId: shop.id, name: 'Charging Port (Universal)',   brand: null,      category: 'SPARE_PART', buyingPrice: dec(200),  sellingPrice: dec(500),  stockQty: 3, imeiTracked: false, lowStockAlert: 5 } }),

    // SIM
    prisma.product.create({ data: { shopId: shop.id, name: 'Jazz SIM (New)',    brand: 'Jazz',    category: 'SIM', buyingPrice: dec(100), sellingPrice: dec(200), stockQty: 30, imeiTracked: false, lowStockAlert: 5 } }),
    prisma.product.create({ data: { shopId: shop.id, name: 'Zong SIM (New)',    brand: 'Zong',    category: 'SIM', buyingPrice: dec(100), sellingPrice: dec(200), stockQty: 20, imeiTracked: false, lowStockAlert: 5 } }),
  ])
  console.log(`   ✓ Products: ${products.length}`)

  const [samsungA15, iPhone14, tecno, vivo, oppo,
         glass, cover, airpods, cable,
         samsungCharger, appleCharger,
         samsungDisplay, iphoneBattery, chargingPort,
         jazzSim, zongSim] = products

  // ── 5. Customers ───────────────────────────────────────────────────────────
  const customers = await Promise.all([
    prisma.customer.create({ data: { shopId: shop.id, name: 'Tariq Mehmood',  phone: '03451234567', balanceOwed: dec(12000), notes: 'Regular customer, reliable payer' } }),
    prisma.customer.create({ data: { shopId: shop.id, name: 'Zara Hussain',   phone: '03331234567', balanceOwed: dec(5500) } }),
    prisma.customer.create({ data: { shopId: shop.id, name: 'Fahad Sheikh',   phone: '03201234567', balanceOwed: dec(0) } }),
    prisma.customer.create({ data: { shopId: shop.id, name: 'Asma Bibi',      phone: '03101234567', balanceOwed: dec(8800) } }),
    prisma.customer.create({ data: { shopId: shop.id, name: 'Imran Siddiqui', phone: '03051234567', balanceOwed: dec(2200) } }),
    prisma.customer.create({ data: { shopId: shop.id, name: 'Nadia Iqbal',    phone: '03421234567', balanceOwed: dec(0) } }),
    prisma.customer.create({ data: { shopId: shop.id, name: 'Rao Asif',       phone: '03001112233', balanceOwed: dec(44000), notes: 'Bought iPhone on udhaar — follow up' } }),
  ])
  console.log(`   ✓ Customers: ${customers.length}`)

  const [tariq, zara, fahad, asma, imran, nadia, rao] = customers

  // ── 6. Sales (last 30 days) ────────────────────────────────────────────────
  let invoiceSeq = 1
  const inv = () => `INV-${String(invoiceSeq++).padStart(4, '0')}`

  const salesData = [
    // Today
    { dA: 0, cust: fahad,  items: [{ p: samsungA15, q: 1, up: 44000 }, { p: glass,  q: 2, up: 150  }], pay: 'CASH'     as const },
    { dA: 0, cust: null,   items: [{ p: cable,  q: 3, up: 250   }, { p: cover,  q: 2, up: 200  }], pay: 'CASH'     as const },
    { dA: 0, cust: nadia,  items: [{ p: samsungCharger, q: 1, up: 1400 }], pay: 'EASYPAISA' as const },
    // Yesterday
    { dA: 1, cust: tariq,  items: [{ p: tecno,  q: 1, up: 32000 }], pay: 'CREDIT'   as const },
    { dA: 1, cust: null,   items: [{ p: airpods, q: 2, up: 800  }, { p: cable,  q: 1, up: 250  }], pay: 'CASH'     as const },
    { dA: 1, cust: zara,   items: [{ p: oppo,   q: 1, up: 48000 }], pay: 'JAZZCASH' as const },
    // 2 days ago
    { dA: 2, cust: null,   items: [{ p: glass,  q: 5, up: 150   }, { p: cover,  q: 3, up: 200  }], pay: 'CASH'     as const },
    { dA: 2, cust: imran,  items: [{ p: vivo,   q: 1, up: 38000 }], pay: 'CREDIT'   as const },
    // 3 days ago
    { dA: 3, cust: rao,    items: [{ p: iPhone14, q: 1, up: 205000 }], pay: 'CREDIT' as const },
    { dA: 3, cust: null,   items: [{ p: appleCharger, q: 1, up: 1800 }, { p: jazzSim, q: 2, up: 200 }], pay: 'CASH' as const },
    // 5 days ago
    { dA: 5, cust: asma,   items: [{ p: samsungA15, q: 1, up: 44000 }], pay: 'CREDIT'   as const },
    { dA: 5, cust: null,   items: [{ p: airpods, q: 1, up: 800  }, { p: glass,  q: 3, up: 150  }], pay: 'CASH'     as const },
    // 7 days ago
    { dA: 7, cust: fahad,  items: [{ p: cable,  q: 4, up: 250   }], pay: 'CASH'     as const },
    { dA: 7, cust: null,   items: [{ p: zongSim, q: 3, up: 200  }], pay: 'CASH'     as const },
    // 10 days ago
    { dA: 10, cust: null,  items: [{ p: samsungA15, q: 1, up: 44000 }, { p: cover, q: 1, up: 200 }], pay: 'CASH' as const },
    { dA: 10, cust: nadia, items: [{ p: glass,  q: 2, up: 150   }], pay: 'EASYPAISA' as const },
    // 14 days ago
    { dA: 14, cust: tariq, items: [{ p: tecno,  q: 2, up: 32000 }], pay: 'BANK_TRANSFER' as const },
    { dA: 14, cust: null,  items: [{ p: samsungCharger, q: 2, up: 1400 }, { p: cable, q: 2, up: 250 }], pay: 'CASH' as const },
    // 20 days ago
    { dA: 20, cust: null,  items: [{ p: oppo,   q: 1, up: 48000 }], pay: 'CASH'     as const },
    { dA: 20, cust: imran, items: [{ p: glass,  q: 10, up: 150  }], pay: 'CASH'     as const },
    // 28 days ago
    { dA: 28, cust: null,  items: [{ p: samsungA15, q: 1, up: 44000 }], pay: 'EASYPAISA' as const },
    { dA: 28, cust: null,  items: [{ p: airpods, q: 3, up: 800  }, { p: appleCharger, q: 1, up: 1800 }], pay: 'CASH' as const },
  ]

  for (const s of salesData) {
    const subtotal = s.items.reduce((sum, i) => sum + i.q * i.up, 0)
    const total = subtotal
    const saleDate = daysAgo(s.dA)
    const sale = await prisma.sale.create({
      data: {
        shopId: shop.id,
        customerId: s.cust?.id,
        invoiceNumber: inv(),
        subtotal: dec(subtotal),
        discount: dec(0),
        total: dec(total),
        amountPaid: dec(s.pay === 'CREDIT' ? 0 : total),
        paymentMethod: s.pay,
        createdById: owner.id,
        createdAt: saleDate,
        items: {
          create: s.items.map(i => ({
            productId: i.p.id,
            qty: i.q,
            unitPrice: dec(i.up),
          })),
        },
      },
    })
    // Credit → add ledger entry
    if (s.pay === 'CREDIT' && s.cust) {
      await prisma.ledgerEntry.create({
        data: {
          customerId: s.cust.id,
          type: 'CREDIT',
          amount: dec(total),
          description: `Sale ${sale.invoiceNumber}`,
          saleId: sale.id,
          createdAt: saleDate,
        },
      })
    }
  }
  console.log(`   ✓ Sales: ${salesData.length}`)

  // Ledger payments (partial repayments)
  await prisma.ledgerEntry.create({ data: { customerId: tariq.id, type: 'PAYMENT', amount: dec(20000), description: 'Cash payment', createdAt: daysAgo(2) } })
  await prisma.ledgerEntry.create({ data: { customerId: zara.id,  type: 'PAYMENT', amount: dec(42500), description: 'Bank transfer', createdAt: daysAgo(5) } })
  await prisma.ledgerEntry.create({ data: { customerId: rao.id,   type: 'PAYMENT', amount: dec(161000), description: 'Partial cash', createdAt: daysAgo(1) } })
  await prisma.ledgerEntry.create({ data: { customerId: imran.id, type: 'PAYMENT', amount: dec(35800), description: 'Cash', createdAt: daysAgo(4) } })

  // ── 7. Easy Load accounts & transactions ───────────────────────────────────
  const jazzAcc = await prisma.easyLoadAccount.create({
    data: { shopId: shop.id, network: 'JAZZ', phoneNumber: '03001234567', currentBalance: dec(8500) },
  })
  const telenorAcc = await prisma.easyLoadAccount.create({
    data: { shopId: shop.id, network: 'TELENOR', phoneNumber: '03451234567', currentBalance: dec(5200) },
  })
  const zongAcc = await prisma.easyLoadAccount.create({
    data: { shopId: shop.id, network: 'ZONG', phoneNumber: '03101234567', currentBalance: dec(3100) },
  })

  const easyLoadTxns = [
    // Jazz
    { acc: jazzAcc, type: 'LOAD' as const, amount: 500,  profit: 15, bal: 9000,  dA: 0 },
    { acc: jazzAcc, type: 'LOAD' as const, amount: 1000, profit: 30, bal: 8000,  dA: 0 },
    { acc: jazzAcc, type: 'TOPUP' as const, amount: 5000, profit: 0, bal: 13000, dA: 1 },
    { acc: jazzAcc, type: 'LOAD' as const, amount: 200,  profit: 6,  bal: 12800, dA: 1 },
    { acc: jazzAcc, type: 'LOAD' as const, amount: 300,  profit: 9,  bal: 12500, dA: 2 },
    { acc: jazzAcc, type: 'LOAD' as const, amount: 1500, profit: 45, bal: 11000, dA: 3 },
    // Telenor
    { acc: telenorAcc, type: 'LOAD' as const, amount: 500,  profit: 15, bal: 5700, dA: 0 },
    { acc: telenorAcc, type: 'LOAD' as const, amount: 1000, profit: 30, bal: 4700, dA: 1 },
    { acc: telenorAcc, type: 'TOPUP' as const, amount: 3000, profit: 0, bal: 7700, dA: 2 },
    // Zong
    { acc: zongAcc, type: 'LOAD' as const, amount: 500,  profit: 15, bal: 3600, dA: 0 },
    { acc: zongAcc, type: 'LOAD' as const, amount: 200,  profit: 6,  bal: 3400, dA: 2 },
  ]

  for (const t of easyLoadTxns) {
    await prisma.easyLoadTxn.create({
      data: {
        accountId: t.acc.id,
        type: t.type,
        amount: dec(t.amount),
        profitMargin: dec(t.profit),
        balanceAfter: dec(t.bal),
        customerPhone: t.type === 'LOAD' ? `030${rand(10000000, 99999999)}` : undefined,
        createdAt: daysAgo(t.dA),
      },
    })
  }
  console.log(`   ✓ Easy Load: ${easyLoadTxns.length} transactions`)

  // ── 8. Easypaisa account & transactions ────────────────────────────────────
  const epAcc = await prisma.easypaisaAccount.create({
    data: { shopId: shop.id, accountName: 'Ahmed Khan EP', accountPhone: '03001234567', currentBalance: dec(42500), provider: 'EASYPAISA' },
  })
  const jcAcc = await prisma.easypaisaAccount.create({
    data: { shopId: shop.id, accountName: 'Ahmed Khan JC', accountPhone: '03441234567', currentBalance: dec(18000), provider: 'JAZZCASH' },
  })

  const epTxns = [
    { acc: epAcc, type: 'CASH_IN'  as const, amount: 5000,  fee: 0,  comm: 50,  bal: 47500, dA: 0 },
    { acc: epAcc, type: 'CASH_OUT' as const, amount: 3000,  fee: 0,  comm: 45,  bal: 44500, dA: 0 },
    { acc: epAcc, type: 'SEND'     as const, amount: 2000,  fee: 15, comm: 0,   bal: 42500, dA: 1 },
    { acc: epAcc, type: 'RECEIVE'  as const, amount: 10000, fee: 0,  comm: 0,   bal: 52500, dA: 1 },
    { acc: epAcc, type: 'CASH_IN'  as const, amount: 8000,  fee: 0,  comm: 80,  bal: 60500, dA: 2 },
    { acc: epAcc, type: 'CASH_OUT' as const, amount: 15000, fee: 0,  comm: 150, bal: 45500, dA: 3 },
    { acc: epAcc, type: 'WITHDRAW' as const, amount: 3000,  fee: 20, comm: 0,   bal: 42500, dA: 4 },
    { acc: jcAcc, type: 'CASH_IN'  as const, amount: 5000,  fee: 0,  comm: 50,  bal: 23000, dA: 0 },
    { acc: jcAcc, type: 'SEND'     as const, amount: 5000,  fee: 30, comm: 0,   bal: 18000, dA: 1 },
  ]

  for (const t of epTxns) {
    await prisma.easypaisaTxn.create({
      data: {
        accountId: t.acc.id,
        type: t.type,
        amount: dec(t.amount),
        fee: dec(t.fee),
        commission: dec(t.comm),
        balanceAfter: dec(t.bal),
        counterparty: `030${rand(10000000, 99999999)}`,
        createdAt: daysAgo(t.dA),
      },
    })
  }
  console.log(`   ✓ Easypaisa: ${epTxns.length} transactions`)

  // ── 9. Repair jobs ─────────────────────────────────────────────────────────
  const repairs = [
    {
      customer: tariq, device: 'Samsung', model: 'Galaxy A15',
      fault: 'Screen cracked, touch not working',
      status: 'DELIVERED' as const, advance: 2000, quote: 4500,
      dA: 12, deliveredDA: 5, tech: tech.id,
      parts: [{ p: samsungDisplay, q: 1, up: 4500 }],
    },
    {
      customer: zara, device: 'Apple', model: 'iPhone 14',
      fault: 'Battery draining too fast, needs replacement',
      status: 'READY' as const, advance: 3000, quote: 6500,
      dA: 5, deliveredDA: null, tech: tech.id,
      parts: [{ p: iphoneBattery, q: 1, up: 6500 }],
    },
    {
      customer: fahad, device: 'Oppo', model: 'A57',
      fault: 'Not charging, charging port loose',
      status: 'IN_REPAIR' as const, advance: 500, quote: 800,
      dA: 3, deliveredDA: null, tech: tech.id,
      parts: [{ p: chargingPort, q: 1, up: 500 }],
    },
    {
      customer: asma, device: 'Vivo', model: 'Y21',
      fault: 'Phone fell in water, not turning on',
      status: 'DIAGNOSING' as const, advance: 0, quote: null,
      dA: 2, deliveredDA: null, tech: null,
      parts: [],
    },
    {
      customer: imran, device: 'Tecno', model: 'Spark 10',
      fault: 'Back camera blurry',
      status: 'AWAITING_PARTS' as const, advance: 1000, quote: 2500,
      dA: 4, deliveredDA: null, tech: tech.id,
      parts: [],
    },
    {
      customer: nadia, device: 'Samsung', model: 'A05',
      fault: 'Screen light flickering',
      status: 'RECEIVED' as const, advance: 0, quote: null,
      dA: 0, deliveredDA: null, tech: null,
      parts: [],
    },
    {
      customer: rao, device: 'Apple', model: 'iPhone 13',
      fault: 'Speaker not working after water damage',
      status: 'DELIVERED' as const, advance: 1500, quote: 3500,
      dA: 20, deliveredDA: 14, tech: tech.id,
      parts: [],
    },
  ]

  let jobSeq = 1
  for (const r of repairs) {
    const jobNumber = `JOB-${String(jobSeq++).padStart(4, '0')}`
    const createdAt = daysAgo(r.dA)
    const deliveredAt = r.deliveredDA !== null ? daysAgo(r.deliveredDA) : null

    await prisma.repairJob.create({
      data: {
        shopId: shop.id,
        customerId: r.customer.id,
        jobNumber,
        deviceBrand: r.device,
        deviceModel: r.model,
        faultDesc: r.fault,
        status: r.status,
        advancePaid: dec(r.advance),
        totalQuote: r.quote ? dec(r.quote) : null,
        technicianId: r.tech,
        deliveredAt,
        createdAt,
        updatedAt: createdAt,
        parts: r.parts.length > 0
          ? { create: r.parts.map(p => ({ productId: p.p.id, qty: p.q, unitPrice: dec(p.up) })) }
          : undefined,
      },
    })
  }
  console.log(`   ✓ Repair jobs: ${repairs.length}`)

  // ── 10. Cash Register (last 7 days) ────────────────────────────────────────
  const cashDays = [
    { dA: 0, open: 15000, salesCash: 45300, loadCash: 2850, epCash: 1200, repairCash: 0,    exp: 2500 },
    { dA: 1, open: 61850, salesCash: 81400, loadCash: 2100, epCash: 2750, repairCash: 4500, exp: 3000 },
    { dA: 2, open: 18000, salesCash: 1750,  loadCash: 1500, epCash: 4200, repairCash: 0,    exp: 1500 },
    { dA: 3, open: 22000, salesCash: 2200,  loadCash: 1350, epCash: 5800, repairCash: 0,    exp: 2000 },
    { dA: 4, open: 28350, salesCash: 3500,  loadCash: 900,  epCash: 1800, repairCash: 3500, exp: 1200 },
    { dA: 5, open: 34950, salesCash: 1000,  loadCash: 450,  epCash: 3600, repairCash: 0,    exp: 800  },
    { dA: 6, open: 39200, salesCash: 1200,  loadCash: 600,  epCash: 2100, repairCash: 0,    exp: 500  },
  ]

  for (const c of cashDays) {
    const date = new Date(); date.setDate(date.getDate() - c.dA); date.setHours(0, 0, 0, 0)
    const closing = c.dA > 0
      ? c.open + c.salesCash + c.loadCash + c.epCash + c.repairCash - c.exp
      : null

    const cr = await prisma.cashRegister.create({
      data: {
        shopId: shop.id,
        date,
        openingBalance: dec(c.open),
        closingBalance: closing ? dec(closing) : null,
        salesCash: dec(c.salesCash),
        easyLoadCash: dec(c.loadCash),
        easypaisaCash: dec(c.epCash),
        repairCash: dec(c.repairCash),
        expenses: dec(c.exp),
        isClosed: c.dA > 0,
        createdAt: date,
        updatedAt: date,
      },
    })

    if (c.exp > 0) {
      const expenseLabels = ['Electricity', 'Rent', 'Tea & Snacks', 'Courier', 'Shop maintenance']
      await prisma.cashExpense.create({
        data: {
          cashRegisterId: cr.id,
          description: expenseLabels[c.dA % expenseLabels.length],
          amount: dec(c.exp),
          createdAt: date,
        },
      })
    }
  }
  console.log(`   ✓ Cash register: ${cashDays.length} days`)

  console.log('\n✅  Seed complete!\n')
  console.log('   🔑  Demo login credentials:')
  console.log('       Email:    demo@mobileshop.pk')
  console.log('       Password: Demo1234!')
  console.log('\n   🌐  Web:    https://mobile-shop-saas-web.vercel.app')
  console.log('   📱  API:    https://mobile-shop-saas.onrender.com/api/v1\n')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
