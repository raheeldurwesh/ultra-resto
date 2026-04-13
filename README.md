# TableServe - Modern Restaurant POS & SaaS Platform

**TableServe** is a premium, multi-tenant SaaS application designed to revolutionize the dining experience. It bridges the gap between traditional hospitality and digital efficiency by providing restaurant owners, staff, and customers with a seamless, real-time ecosystem.

## 🚀 Key Features

### 🏢 Super Admin Panel (White-Label Control)
- **Tenant Management**: Onboard and manage multiple restaurants from a single command center.
- **Admin Impersonation**: Securely log into any restaurant's dashboard to troubleshoot or configure settings without needing their credentials.
- **Plateform Analytics**: Track growth and activity across all registered tenants.

### ⚙️ Restaurant Admin Panel
- **Menu Management**: Dynamic, category-based menu editor with image support.
- **Staff Control**: Manage Waiter accounts and permissions.
- **Settings & QR Generation**: Configure tax rates, restaurant branding, and generate HD QR code assets for every table.
- **Analytics**: Deep dive into daily and monthly revenue trends.

### 👨‍🍳 Waiter Dashboard
- **Real-time Order Sync**: Orders placed by customers appear instantly via Supabase Realtime.
- **Order Tracking**: Update order statuses (Pending, Preparing, Ready, Served) in one click.
- **KOT & Invoicing**: Generate professional PDF invoices and track order items.

### 📱 Customer Experience
- **QR Ordering**: No app download required. Scan a table QR to browse the menu.
- **Digital Cart**: Premium, smooth cart experience with special instruction support.
- **Order Cooldown**: Intelligent 40-second device-specific lockout to prevent duplicate orders.
- **Invoice Downloads**: Customers can download a digital copy of their bill immediately after ordering.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Broadcast & Postgres Changes
- **Auth**: Supabase Auth (magic links & password-based)
- **Logic**: Supabase Edge Functions (Deno/TypeScript)
- **PDF Generation**: jsPDF
- **Styling**: Vanilla CSS + Tailwind utilities

---

## 🛠️ Getting Started

### 1. Clone & Install
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Edge Function Deployment
Before using Super Admin features (Disable, Delete, etc.), you must deploy the new actions function:
```bash
supabase functions deploy superadmin-actions
supabase functions deploy impersonate-admin
```

### 4. Run Locally
```bash
npm run dev
```

---

## 🛡️ Security & Architecture
- **Row Level Security (RLS)**: Every database table is protected by strict RLS policies to ensure tenant isolation.
- **Edge Functions**: Sensitive operations like admin impersonation are handled server-side to prevent key exposure.
- **Persistence**: Admin impersonation states and customer cooldowns are persisted via `localStorage` for a reliable user experience across sessions.

---

## 🤝 Contact & Support
Founded by **Raheel Durwesh**.  
For inquiries or custom solutions, reach out via:
- **WhatsApp**: +91 93593 00613
- **Instagram**: [@raheeldurwesh](https://www.instagram.com/raheeldurwesh)

© 2026 TableServe POS Systems. All rights reserved.
