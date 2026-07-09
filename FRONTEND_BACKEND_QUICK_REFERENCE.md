# Quick Summary: What Goes Where?

## TL;DR - Quick Reference

| Feature | Frontend (React) | Backend (Next.js) | Stripe |
|---------|------------------|-------------------|--------|
| **Points Calculator** | ✅ Local state | ❌ | ❌ |
| **Visa Quote Calculator** | ✅ Local state | ❌ | ❌ |
| **Persona Selection** | ✅ Local state | ❌ | ❌ |
| **Form Submission** | ✅ UI + Validation | ✅ Process + Save | ❌ |
| **Payments** | ❌ | ✅ Create Intent | ✅ Process |
| **Invoices** | ❌ | ✅ Generate + Send | ✅ Track |
| **User Login** | ✅ Form UI | ✅ Auth Logic | ❌ |
| **File Upload** | ✅ UI + Preview | ✅ Validate + Store | ❌ |
| **Admin Data Entry** | ✅ Form UI | ✅ Validation + CRUD | ❌ |
| **Email Sending** | ❌ | ✅ | ❌ |
| **Document Storage** | ❌ | ✅ | ❌ |
| **Consultation Booking** | ✅ UI | ✅ Logic | ❌ |

---

## Simple Decision Tree

```
┌─ Does it need a database? 
│  ├─ NO → Frontend only ✅ (localStorage if needed)
│  └─ YES → Backend needed ✅
│
├─ Does it handle payments?
│  ├─ YES → Backend + Stripe ✅✅
│  └─ NO → Continue...
│
├─ Does it need security (auth, API keys)?
│  ├─ YES → Backend only ✅
│  └─ NO → Continue...
│
├─ Does it need external API calls?
│  ├─ YES → Backend (hide API keys) ✅
│  └─ NO → Continue...
│
└─ Is it just UI with local calculations?
   ├─ YES → Frontend only ✅
   └─ NO → Backend ✅
```

---

## Examples

### ✅ Frontend Only (Simple Forms)
```typescript
// Points calculator - no backend needed
const [age, setAge] = useState('25-32');
const [english, setEnglish] = useState('proficient');

const points = calculatePoints(age, english);
// Result: 40 points instantly
```

### ✅ Frontend + Backend (Form Submission)
```typescript
// Frontend
const onSubmit = async (formData) => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
};

// Backend (Next.js)
export async function POST(req) {
  const data = await req.json();
  // Validate against DB
  // Hash password
  // Save to DB
  return response;
}
```

### ❌ DON'T DO THIS (Security Risk)
```typescript
// ❌ WRONG - Never do this!
const stripe = new Stripe('sk_live_xxxxxx'); // Exposed!
const payment = await stripe.paymentIntents.create(...);
```

### ✅ DO THIS (Secure)
```typescript
// Frontend
const response = await fetch('/api/payments/create', {
  method: 'POST',
  body: JSON.stringify({visa: 'skilled', amount: 5000})
});

// Backend (Next.js)
export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const intent = await stripe.paymentIntents.create(...);
  return intent;
}
```

---

## By Feature

### 📊 Points Calculator
- **UI:** React component ✅
- **Form:** Input fields ✅
- **Calculation:** Client-side math ✅
- **Storage:** localStorage (if needed) ✅
- **Backend:** Not needed ❌

### 💳 Payment Processing
- **UI:** React component ✅
- **Validation:** Frontend format check ✅
- **Stripe:** Backend only ✅
- **Intent:** Next.js API ✅
- **Storage:** Database ✅
- **Webhook:** Next.js handler ✅

### 📋 News/Articles
- **Display:** React component ✅
- **Fetch:** API call ✅
- **Filter:** Frontend logic ✅
- **Admin Edit:** React form + Backend API ✅
- **Storage:** Database ✅

### 👤 User Auth
- **Login UI:** React form ✅
- **Validation:** Backend ✅
- **Session:** JWT (backend-managed) ✅
- **Storage:** Database ✅

### 📤 File Upload
- **UI:** React file input ✅
- **Preview:** Client-side ✅
- **Size check:** Frontend warning ✅
- **Upload handler:** Next.js ✅
- **Storage:** S3/Cloud storage ✅
- **Scanning:** Backend virus check ✅

### 📧 Email Sending
- **Trigger:** Could be frontend/backend ✅
- **Template:** Backend only ✅
- **SendGrid/Mailgun:** Backend only ✅
- **Tracking:** Backend database ✅

### 💰 Invoices
- **Generation:** Backend ✅
- **Storage:** Database + PDF storage ✅
- **Download:** API endpoint ✅
- **Email:** Backend sends ✅

### 🎯 Admin Operations
- **UI:** React form ✅
- **Auth:** Backend check ✅
- **Validation:** Backend rules ✅
- **CRUD:** Backend API ✅
- **Audit Log:** Backend stores ✅

---

## Current Architecture

```
Vite + React (Frontend)
├── User Input Forms
├── Local Calculations
├── API Calls to Backend
└── Display Results

          ↕ (HTTP)

Next.js Needed (Backend)
├── Authentication
├── Payment Processing
├── Database Operations
├── Email Sending
├── File Storage
└── Admin Operations

          ↕ (API calls)

External Services
├── Stripe (payments)
├── SendGrid (email)
├── S3 (storage)
└── Supabase (database)
```

---

## Implementation Steps

### Step 1: Keep Current Frontend ✅
Points Calculator, Quote Calculator, Persona Selection
→ These are perfect as-is

### Step 2: Add Form Handlers ✅
User inputs data → Send to backend → Backend validates/saves

### Step 3: Build Next.js Backend ✅ (Priority)
```
/api/
├── auth/
│   ├── login.ts
│   ├── signup.ts
│   └── logout.ts
├── payments/
│   ├── create-intent.ts
│   ├── webhook.ts
│   └── invoice.ts
├── uploads/
│   ├── document.ts
│   └── image.ts
├── admin/
│   ├── news.ts
│   ├── occupations.ts
│   └── config.ts
└── ...
```

### Step 4: Integrate Stripe ✅
- Create Account
- Add Secret Key to `.env`
- Create payment intent endpoint
- Setup webhook handler

### Step 5: Setup Email ✅
- Choose provider (SendGrid, Mailgun, etc.)
- Add API key to `.env`
- Create email sending service
- Setup email templates

---

## Environment Variables Needed

```env
# Stripe (Backend Only)
STRIPE_SECRET_KEY=sk_live_xxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxx

# Email (Backend Only)
SENDGRID_API_KEY=SG.xxxxxx
EMAIL_FROM=noreply@migrationpath.com

# Database (Backend Only)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxx
SUPABASE_SERVICE_KEY=eyJxxxx

# Frontend (Public OK)
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=MigrationPath
```

---

## Common Mistakes to Avoid

### ❌ Exposing Secrets
```typescript
// WRONG
const stripe = new Stripe('sk_live_xxx'); // In frontend!
export const API_KEY = 'secret_key'; // In public code!
```

### ✅ Hide Secrets
```typescript
// CORRECT (Backend)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

### ❌ Trusting Client Validation
```typescript
// WRONG - User can modify on client
const points = userData.points; // Not validated!
```

### ✅ Validate on Backend
```typescript
// CORRECT - Backend verifies
const actualPoints = calculatePoints(userData, dbOccupationData);
```

### ❌ Direct DB Access from Frontend
```typescript
// WRONG
import { supabase } from '@/lib/supabase';
export async function getUserData() {
  return supabase.from('users').select('*');
}
```

### ✅ Use API Endpoints
```typescript
// CORRECT
export async function GET(req) {
  // Backend controls what data is exposed
  const user = await db.users.findOne(req.user.id);
  return json({ name: user.name }); // Don't send password!
}
```

---

## Checklist

- [ ] Keep current frontend as-is (Points Calculator, Quotes, etc.)
- [ ] Create Next.js `/api` directory
- [ ] Setup environment variables
- [ ] Create auth endpoints
- [ ] Create payment endpoints with Stripe
- [ ] Create admin endpoints with RBAC
- [ ] Add form submission handlers in React
- [ ] Add error handling and loading states
- [ ] Setup audit logging
- [ ] Test all endpoints

---

## Questions to Answer

**Q: Do I need Next.js?**
A: Yes, for backend operations (payments, auth, database)

**Q: Can I do payments from React?**
A: No, Stripe keys must be on backend

**Q: What about the calculator?**
A: Keep it on frontend - instant feedback, no persistence

**Q: When do I need database?**
A: When storing: user data, payments, articles, documents

**Q: How do I know if it's frontend or backend?**
A: Use the decision tree above

