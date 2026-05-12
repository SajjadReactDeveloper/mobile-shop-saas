export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  tag: string
  tagColor: string
  author: string
  authorInitials: string
  authorColor: string
  sections: { heading?: string; body: string }[]
}

export const posts: BlogPost[] = [
  {
    slug: 'why-mobile-shops-need-imei-tracking',
    title: 'Why Every Mobile Shop Needs IMEI Tracking',
    excerpt: "Selling a phone without logging its IMEI is one of the most common — and costly — mistakes in the mobile business. Here's how to fix it.",
    date: 'May 10, 2026',
    readTime: '4 min read',
    tag: 'Inventory',
    tagColor: 'bg-blue-50 text-blue-700',
    author: 'Sajjad Akhtar',
    authorInitials: 'SA',
    authorColor: 'bg-violet-600',
    sections: [
      {
        body: "Ask any mobile shop owner what happens when a customer comes back claiming their purchased phone was stolen or tampered with — and you'll hear a story of either a long argument or a quick loss. The root of the problem is almost always the same: nobody wrote down the IMEI.",
      },
      {
        heading: 'What is an IMEI and why does it matter?',
        body: "Every mobile phone has a unique 15-digit IMEI (International Mobile Equipment Identity) number. It's essentially the phone's fingerprint. Carriers, police, and repair shops can identify any device by its IMEI. When you sell a phone without recording its IMEI, you have no proof of which specific unit left your shop — or when, or to whom.",
      },
      {
        heading: 'The three problems that come from skipping IMEI tracking',
        body: "First: disputes. A customer claims the phone you sold them was a display piece or had a replaced screen. Without the IMEI logged at the time of purchase, you can't prove anything. Second: theft. If a stolen phone passes through your shop, you need records to show you received it before the theft was reported. Third: returns. Without IMEI records, you can't verify whether the phone a customer is returning is actually the one they bought from you.",
      },
      {
        heading: 'How to implement IMEI tracking without slowing down sales',
        body: "The trick is to log the IMEI at the point of purchase — not at the point of sale. When stock arrives from a supplier, scan or type each IMEI into your system. Tag it to the specific product (model + color + storage). When you sell it, the IMEI is already there; you just confirm it's the right one and close the sale. In Flowchat, this is built into the stock entry flow. You add a phone to inventory and the IMEI field is right there. At the POS, you select the product and pick the IMEI from the available units — no extra steps.",
      },
      {
        heading: 'What about accessories?',
        body: "Accessories don't need IMEI tracking — chargers, cables, and covers don't have unique identifiers. In Flowchat, IMEI tracking is a per-product toggle. Turn it on for mobiles, leave it off for everything else. Bulk accessories can still be tracked by quantity without any IMEI complexity.",
      },
      {
        heading: 'The bottom line',
        body: "IMEI tracking takes about 30 extra seconds per phone when stock arrives. It saves you hours of arguments, thousands in disputed returns, and the legal headache of an unverified stolen phone. If you're not doing it already, start today.",
      },
    ],
  },
  {
    slug: 'easy-load-profit-guide',
    title: 'How to Maximize Easy Load Profit: A Complete Guide',
    excerpt: "Most shop owners know their balance, but not their actual commission earned. We break down how to track per-network profit properly.",
    date: 'May 5, 2026',
    readTime: '6 min read',
    tag: 'Easy Load',
    tagColor: 'bg-green-50 text-green-700',
    author: 'Sajjad Akhtar',
    authorInitials: 'SA',
    authorColor: 'bg-violet-600',
    sections: [
      {
        body: "Easy load is one of the highest-frequency transactions in any Pakistani mobile shop. Dozens of transactions a day, each one small, but the commissions add up fast — if you're tracking them. Most shop owners aren't.",
      },
      {
        heading: 'How easy load commission actually works',
        body: "Networks pay you a commission for every recharge you process. The rate varies by network and sometimes by transaction amount. Jazz typically pays around 3.5–4%, Telenor slightly less, Zong and Ufone in a similar range. The commission is deducted from your SIM balance — so if a customer recharges Rs 100, your balance goes down by approximately Rs 96–97, and the difference is your commission.",
      },
      {
        heading: 'Why most shops undercount their profit',
        body: "The most common mistake: shop owners only look at their SIM balance and their top-up receipts. They don't calculate commission per transaction. At the end of the day they don't know if they made Rs 800 or Rs 1,200 in easy load commission — they just know the balance went up and down. This makes it impossible to price your services correctly or catch discrepancies when balance doesn't match expectations.",
      },
      {
        heading: 'Setting the right commission rate per network',
        body: "In Flowchat's easy load module, you set a commission rate per SIM account. When you enter a transaction (customer loads Rs 200 on Jazz), the system automatically calculates your commission and records it as profit. Over the day, week, or month, you see total commissions earned per network — not just balance movements.",
      },
      {
        heading: 'Managing multiple SIMs per network',
        body: "Many shops run multiple SIMs for the same network — one for regular customers, one kept loaded for large transactions. Flowchat lets you register as many SIM accounts as you have, each with its own balance and transaction history. You can see at a glance which SIM is running low before a customer's transaction fails.",
      },
      {
        heading: 'The balance top-up entry',
        body: "When you recharge your own SIM (from your franchise or local agent), that's not income — it's a balance transfer. Recording it correctly as a top-up (not a profit event) keeps your daily commission numbers clean. Flowchat separates top-up entries from load transactions so your profit figure only includes actual commissions earned.",
      },
      {
        heading: 'What a good daily easy load summary looks like',
        body: "At the end of the day you should be able to see: total amount loaded per network, total commission earned per network, current balance per SIM, and which SIMs need a top-up. That's exactly what Flowchat's daily summary shows. If something looks off — say Jazz commission is lower than expected — you can drill into individual transactions and find the discrepancy.",
      },
    ],
  },
  {
    slug: 'udhaar-management-tips',
    title: '5 Ways to Reduce Bad Udhaar in Your Shop',
    excerpt: "Credit sales are a reality of the Pakistani market. But without a system, udhaar quietly eats your profit. Here's how to stay on top of it.",
    date: 'Apr 28, 2026',
    readTime: '5 min read',
    tag: 'Udhaar',
    tagColor: 'bg-amber-50 text-amber-700',
    author: 'Sajjad Akhtar',
    authorInitials: 'SA',
    authorColor: 'bg-violet-600',
    sections: [
      {
        body: "Udhaar isn't going away. In Pakistan's mobile market, extending credit to regular customers is part of doing business. The question isn't whether to do it — it's how to do it without losing money you don't even realize you've lent.",
      },
      {
        heading: '1. Know exactly who owes you what, at all times',
        body: "The first rule of udhaar management is visibility. If your running balance is a notebook or your memory, you'll forget amounts, forget customers, and never chase what you're owed. Keeping a digital ledger with every customer's current balance — updated in real time when a sale or payment happens — is the baseline. Flowchat's customer ledger does this automatically whenever you select Udhaar as the payment method at the POS.",
      },
      {
        heading: '2. Set a credit limit per customer',
        body: "Not every customer deserves the same credit line. Your oldest, most reliable customer might be fine up to Rs 10,000. A newer face should be capped lower. Having a mental or written limit that you actually enforce stops a small udhaar from growing into a debt that's awkward to collect.",
      },
      {
        heading: '3. Send reminders before balances get too large',
        body: "The best time to collect udhaar is before it becomes a big number. A gentle WhatsApp message when a balance hits Rs 2,000 is easier for the customer to handle — and easier for you to send — than a confrontation over Rs 15,000. Flowchat has a one-tap WhatsApp reminder button on each customer's ledger. It sends their current outstanding balance in a friendly message format.",
      },
      {
        heading: '4. Record partial payments immediately',
        body: "When a customer pays something off their udhaar — even Rs 500 on a Rs 3,000 balance — record it on the spot. Don't wait until end of day. If you update the ledger immediately, the customer can see the updated balance, which builds trust and reduces disputes. It also removes the temptation to mentally round amounts differently the next day.",
      },
      {
        heading: '5. Review your overdue list every week',
        body: "At minimum once a week, look at which customers have balances older than 30 days. These are the highest-risk debts. Decide whether to chase, restructure, or write off. Doing this weekly keeps the list manageable. Doing it monthly means you're staring at 40 overdue accounts wondering where to start. Flowchat's ledger can be filtered by outstanding balance and last payment date, so this review takes under 5 minutes.",
      },
      {
        heading: 'The honest truth about udhaar',
        body: "Some udhaar will never be collected. That's the cost of doing business in a credit-based market. But the difference between shops that manage it well and shops that don't is whether they know which debts are lost versus which ones just need a follow-up. Visibility and reminders won't recover bad debt — but they'll dramatically reduce how much bad debt accumulates in the first place.",
      },
    ],
  },
  {
    slug: 'repair-job-workflow',
    title: 'Building a Repair Workflow That Customers Love',
    excerpt: "A repair job that takes 2 days feels faster than one that takes 1 day — if you communicate better. Here's the status system we recommend.",
    date: 'Apr 20, 2026',
    readTime: '4 min read',
    tag: 'Repairs',
    tagColor: 'bg-rose-50 text-rose-700',
    author: 'Sajjad Akhtar',
    authorInitials: 'SA',
    authorColor: 'bg-violet-600',
    sections: [
      {
        body: "Customer experience in repairs is almost entirely about communication. The repair itself matters, of course — but what customers remember is whether they felt informed or ignored while waiting.",
      },
      {
        heading: 'Why status updates matter more than speed',
        body: "A customer who drops off their phone and hears nothing for 24 hours will call three times to ask for an update. A customer who gets a WhatsApp message saying 'Your phone is in diagnosis — we'll update you within 2 hours' won't call at all. The second scenario takes less of your time and leaves the customer happier, even if the repair takes just as long.",
      },
      {
        heading: 'The six statuses every repair shop needs',
        body: "Received → Diagnosing → Awaiting Parts → In Repair → Ready → Delivered. This is the status flow we recommend — and the one built into Flowchat. Each transition is a natural trigger for a customer update. Moving to 'Awaiting Parts' is a good moment to call with a timeline. Moving to 'Ready' triggers an automatic WhatsApp notification in Flowchat.",
      },
      {
        heading: 'Capturing the right information at intake',
        body: "A good job card captures: customer name and phone number, device brand and model, fault description (in the customer's words), photos of existing damage, advance payment received, and total quote discussed. Photos are the most underrated part — they protect you from claims that you caused damage during repair. Flowchat's job card form includes photo upload via Cloudinary.",
      },
      {
        heading: 'Parts and inventory integration',
        body: "When you use a part for a repair — a charging port, a screen, a battery — that part should come out of your inventory automatically. This keeps your stock count accurate and gives you the true cost of each job. In Flowchat, you can add parts to a repair job and they're deducted from the relevant product's stock quantity.",
      },
      {
        heading: 'The delivery moment',
        body: "When a customer picks up their phone, update the status to Delivered and collect the remaining balance. If they paid an advance, the system already knows how much is outstanding. Generate a final invoice and share it via WhatsApp if they want a receipt. This closing step is what separates a professional shop from one that relies on handshakes and memory.",
      },
    ],
  },
  {
    slug: 'daily-cash-register-habit',
    title: 'The One Habit That Changes Your Shop: Closing Your Cash Register Daily',
    excerpt: "Shop owners who close their cash register every day catch problems the same day. Those who don't discover them weeks later — or never.",
    date: 'Apr 12, 2026',
    readTime: '3 min read',
    tag: 'Cash Register',
    tagColor: 'bg-violet-50 text-violet-700',
    author: 'Sajjad Akhtar',
    authorInitials: 'SA',
    authorColor: 'bg-violet-600',
    sections: [
      {
        body: "Most mobile shop owners have a vague sense of how their day went financially. They count the cash drawer, subtract what they started with, and call it profit. But that number doesn't account for easy load float, Easypaisa wallet movements, repair advance payments, or udhaar collected. The cash register is where all of it comes together.",
      },
      {
        heading: 'What a daily close actually tells you',
        body: "When you close the cash register at end of day, you're reconciling four things: (1) opening balance vs. closing balance in hand, (2) cash sales made, (3) easy load and Easypaisa cash flows, (4) expenses paid out. If the numbers match, your day was clean. If they don't, something was missed — a sale not rung up, a payment pocketed without recording, or a simple counting error.",
      },
      {
        heading: 'Catching problems on the same day',
        body: "A Rs 500 discrepancy caught at 9pm is easy to trace — you can think back through the day's 20-30 transactions and find it. A Rs 500 discrepancy discovered at end of month sits inside 600+ transactions and may never be found. Daily closing is how professional shops maintain financial accuracy without needing an accountant.",
      },
      {
        heading: 'What about staff you trust?',
        body: "Trust and verification are different things. Requiring a daily cash register close isn't an accusation — it's a system. Most short-counting happens not from dishonesty but from sloppy habits: a sale rung up at the wrong amount, change given incorrectly, an expense not noted. A daily close catches these errors before they become habits.",
      },
      {
        heading: 'The 5-minute close',
        body: "A well-designed cash register close takes under 5 minutes if the day's transactions were recorded properly. Open Flowchat, go to Cash Register, review the auto-calculated totals (sales, easy load, Easypaisa, expenses), enter your physical cash count, and close. The system flags any difference between expected and actual. That's your number to investigate.",
      },
      {
        heading: 'Start tomorrow',
        body: "You don't need to retroactively close old days. Just start tomorrow. Open the day with your current cash count, record everything that moves during the day, and close at night. After one week, you'll wonder how you ran the shop without it.",
      },
    ],
  },
  {
    slug: 'easypaisa-jazzcash-agent-tips',
    title: 'Running an Easypaisa/JazzCash Agent Counter: What No One Tells You',
    excerpt: "Float management, transaction limits, and daily balancing — the things that trip up new agents and how to handle them.",
    date: 'Apr 3, 2026',
    readTime: '7 min read',
    tag: 'Easypaisa',
    tagColor: 'bg-emerald-50 text-emerald-700',
    author: 'Sajjad Akhtar',
    authorInitials: 'SA',
    authorColor: 'bg-violet-600',
    sections: [
      {
        body: "Becoming an Easypaisa or JazzCash agent sounds straightforward: register, get a wallet, start transacting. But new agents consistently hit the same problems in the first few weeks — problems that nobody in the franchise office warns you about.",
      },
      {
        heading: 'Float is your biggest constraint',
        body: "Your wallet balance is your float. If your Easypaisa wallet has Rs 20,000 and a customer wants to cash out Rs 25,000, you can't do it. Running out of float mid-day during a busy period is both embarrassing and costly — you turn away a transaction and the commission that comes with it. Experienced agents maintain a float buffer of at least 1.5x their average daily transaction volume.",
      },
      {
        heading: 'Cash-in vs. Cash-out: the float math',
        body: "Cash-in transactions increase your wallet balance (customer gives you cash, you send digital money to their account). Cash-out transactions decrease it (customer gives you digital money, you pay cash). A well-balanced counter roughly nets out — but most agents find they're either cash-heavy or wallet-heavy depending on their area's customer behaviour. Know which direction your counter leans and plan your top-ups accordingly.",
      },
      {
        heading: 'Transaction limits are per-day and per-transaction',
        body: "There are limits on how much a single transaction can be (per-transaction cap) and how much total volume you can process in a day (daily cap). These limits vary by your agent tier and how long your account has been active. New agents have lower limits that increase with time and transaction history. If a customer wants a large transaction and you're near your daily cap, you'll need to decline or ask them to come back tomorrow.",
      },
      {
        heading: 'Recording every fee correctly',
        body: "Your commission is earned as a fee on each transaction type. The fee structure varies: send money, receive money, cash-in, and cash-out all have different commission rates. The mistake most agents make is tracking total wallet movements without recording what type each transaction was — which means at the end of the day they can't tell how much they actually earned vs. how much is float. Flowchat's Easypaisa module lets you log the transaction type, amount, and fee per entry, so your daily commission is calculated automatically.",
      },
      {
        heading: 'The daily balance check',
        body: "At the end of every day, your actual wallet balance (from the Easypaisa/JazzCash app) should match your system balance (sum of all transactions). If they don't, there's either a transaction you forgot to log or a system fee you didn't account for. Doing this check daily is far easier than doing it weekly — you have fewer transactions to cross-reference and the day is fresh in your memory.",
      },
      {
        heading: 'When to add a second wallet',
        body: "If your counter is consistently running out of float before end of day, consider registering a second wallet account (where permitted by the network's terms). This gives you more total float without tying up all your working capital in one place. Some shops run both an Easypaisa and a JazzCash counter to serve customers from both networks.",
      },
      {
        heading: 'The unsexy truth about agent income',
        body: "Easypaisa/JazzCash commission per transaction is small. The income only becomes meaningful at volume — 50+ transactions a day. The best agent counters are in high-foot-traffic areas (near bus stops, markets, or schools) or attached to a shop that already draws customers for other reasons. If you're doing 15–20 transactions a day, your commission income will be modest. Grow it by becoming the most reliable counter in your area — customers develop habits when they know you're always stocked and always open.",
      },
    ],
  },
]

export function getPost(slug: string): BlogPost | undefined {
  return posts.find(p => p.slug === slug)
}
