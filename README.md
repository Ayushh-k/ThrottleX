# THROTTLEX — Rental Business Manager
### **OWN THE ROAD.**

THROTTLEX is a modern, high-performance, responsive web application purpose-built for managing a high-demand motorcycle rental business with multi-partner equity and revenue sharing.

Built inspired by premium fintech dashboards (Linear / Stripe / Brex style dark mode), THROTTLEX delivers instantaneous speed, financial clarity, and automated Splitwise/PhonePe style partner debt resolution.

---

## ⚡ Quick Start

### 1. Requirements
- **Node.js**: v18+ (tested on v22.16.0)
- **MongoDB**: v7+ or v8+ running on `mongodb://127.0.0.1:27017/throttlex`

### 2. Start Application
```bash
# Start the full-stack server (serves both API and UI at http://localhost:5000)
npm start
```
Or run the Vite development server:
```bash
npm run client
# Frontend available at http://localhost:3000
```

### 3. Demo Login Credentials
Both accounts have 1-click login buttons on the login screen or enter:

| Role | Name | Email | Password | Profit Share |
|---|---|---|---|---|
| **Owner / Admin** | Ayush Sharma | `ayush@throttlex.com` | `password123` | 50% |
| **Partner** | Vikram Malhotra | `vikram@throttlex.com` | `password123` | 50% |

---

## 🚀 Key Features

### 1. Executive Telemetry & Real-Time Dashboard
- **Financial Cards**: Total Revenue, Operating Expenses, Net Profit, Profit Margin %, Customer Receivables, Partner Debt Payable, Active Rentals, and Available Fleet.
- **Interactive Analytics**: Revenue, Expense & Profit timelines with dynamic filters (Today, Week, Month, Year).
- **Revenue by Bike**: Bar chart showing earnings per motorcycle.
- **Categorized Expense Breakdown**: Interactive Donut chart.
- **Visual Motorcycle Cards**: Current trip counts, monthly revenue, and net profit per bike with direct profile links.
- **Recent Financial Ledger Stream**: Live chronological money flow.

### 2. Splitwise / PhonePe Style Partner Debt & Settlement Engine
- Mathematically rigorous zero-sum partner cash accounting:
  - Tracks rental payments collected by each partner in hand ($C_i$).
  - Tracks out-of-pocket expenses paid by each partner ($E_i$).
  - Tracks prior settlements sent and received ($S_{sent}, S_{recv}$).
  - Computes net cash held: $\text{CashHeld}_i = C_i - E_i - S_{sent, i} + S_{recv, i}$.
  - Computes fair profit share: $\text{EntitledProfit}_i = \text{RealizedProfit} \times \frac{s_i}{100}$.
  - Computes balance: $\text{Balance}_i = \text{EntitledProfit}_i - \text{CashHeld}_i$.
  - Generates clear settlement recommendation: **"Vikram Malhotra → Pay Ayush Sharma ₹2,850"**.
  - **"Mark as Settled"** button: Records settlement, logs ledger transaction, updates audit trail, and zeroes out outstanding debt.

### 3. Motorcycle Fleet Management & Dedicated Profiles
- Complete fleet tracking:
  - Royal Enfield Hunter 350
  - Royal Enfield Classic 350
  - Royal Enfield Himalayan 450
- Individual Bike Profile:
  - Registration number, odometer, default daily rate, total rental days, total trips.
  - Financial Summary: Total Revenue, Total Expenses, Net Profit, Margin.
  - Complete Rental History table.
  - Complete Expense History table.
  - Dedicated Fuel Section (Litres, amount, price/L, cost per km, mileage in km/L).
  - Dedicated Maintenance Section (Service date, garage, cost, invoice, next service threshold alert).

### 4. Smart Rental Booking & Anti-Double-Booking Engine
- **Availability Engine**: Checks real-time date and time overlaps. If booked, warns: *"Bike unavailable for selected dates"* and suggests nearby available fleet bikes.
- **Automated Duration Calculation**: Calculates days and hourly pricing.
- **Automated Rate Calculation**: Rate × days + security deposit + extra charges - discounts.
- **Late Fee Rules**: Configurable grace period (e.g. 2 hours), hourly penalty (₹100/hr), and full extra day charges.
- **Multi-Payment Support**: Record partial payments across UPI, Cash, Bank Transfer, or Card.

### 5. Financial Ledger & Money Flow
- Comprehensive ledger recording:
  - Customer rental payments
  - Out-of-pocket expenses
  - Partner settlements
  - Partner capital and withdrawals
- Filters: Date range, motorcycle, partner, payment method, transaction type.
- One-click CSV Export.

### 6. Interactive Rental Calendar
- Monthly calendar visualization of bike bookings and schedules.
- Click any booking directly from calendar to inspect contract and invoice.

### 7. Financial Reports & Instant PDF Export
- Executive Business Summary:
  - Month: November 2026
  - Total Rentals, Total Rental Days, Total Revenue, Total Expenses, Net Profit.
  - Top Performing Motorcycle.
  - Highest Expense Category.
  - Partner contributions & recommended settlements.
- One-click **PDF Export** using `jsPDF` and `jspdf-autotable`.
- One-click **CSV Export**.

### 8. Global Instant Search (Ctrl + K)
- Blazing-fast keyboard accessible search across Bikes, Customers, Rentals, Expenses, and Partners.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, jsPDF, jsPDF-AutoTable.
- **Backend**: Node.js, Express.js, Mongoose, JWT, BcryptJS, Morgan, CORS.
- **Database**: MongoDB.
- **Design System**: Matte black / dark charcoal (`#080A0F`), racing orange accent (`#FF5500`), metallic silver (`#94A3B8`).

```
c:\Bike\
├── client\
│   ├── src\
│   │   ├── components\
│   │   │   ├── modals\         # NewRental, ReturnBike, Payment, Expense, Bike, etc.
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── context\            # AuthContext, ThemeContext, NotificationContext
│   │   ├── pages\              # Dashboard, Bikes, Rentals, Expenses, Settlements, etc.
│   │   ├── services\api.js     # API Client
│   │   └── utils\              # formatters, pdfExport, csvExport
├── server\
│   ├── src\
│   │   ├── config\             # db.js, jwt.js
│   │   ├── controllers\        # 14 specialized controllers
│   │   ├── middleware\         # auth.js
│   │   ├── models\             # 14 Mongoose models
│   │   ├── routes\             # Modular Express routers
│   │   ├── seed\seed.js        # Realistic demo scenario generator
│   │   ├── services\           # calculationService, settlementService, ledgerService
│   │   └── server.js           # API entry point & static distributor
└── package.json
```
