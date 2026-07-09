# Visual Guide: Frontend vs Backend Operations

## 🎯 The Simple Rule

| Has Security? | Needs DB? | Needs Calculation from DB? | Location |
|---|---|---|---|
| ❌ No | ❌ No | ❌ No | **Frontend ✅** |
| ❌ No | ✅ Yes | ❌ No | **Backend ✅** |
| ✅ Yes | ❌ No | ❌ No | **Backend ✅** |
| ✅ Yes | ✅ Yes | ✅ Yes | **Backend ✅** |
| ❌ No | ❌ No | ✅ Yes | **Backend ✅** |

## In Practice

### 📱 Frontend (Vite + React)
Things that run in user's browser:
```
User sees this ← React Components
       ↓
   Form Input → Local State
       ↓
  Calculation → Pure Math (no DB)
       ↓
   Display → Show Result
```

**Examples:**
- Points calculator
- Quote calculator  
- Persona selector
- Form field validation (format only)
- Theme toggling
- Expanding/collapsing sections

### 🖥️ Backend (Next.js API)
Things that run on your server:
```
Frontend sends → HTTP POST/GET
       ↓
  Authenticate → Check who's asking
       ↓
   Validate → Check against DB
       ↓
   Process → Complex logic
       ↓
  Database → Read/Write
       ↓
  Response → Send back to frontend
```

**Examples:**
- Login/Logout
- Payment processing
- Saving form data
- Calculating eligibility (needs DB)
- Sending emails
- File uploads

---

## Feature Examples

### Example 1: Points Calculator
```
┌─────────────────────────────────────────────────────┐
│ Frontend (Vite + React)                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│  User selects:                                       │
│  - Age: 25-32                                        │
│  - English: Proficient                              │
│  - Education: Bachelor                              │
│  - Experience: 5 years                              │
│          ↓                                           │
│  Calculate Points:                                  │
│  - Age: 30 points                                   │
│  - English: 10 points                               │
│  - Education: 15 points                             │
│  - Experience: 10 points                            │
│  - Total: 65 points ✅                              │
│          ↓                                           │
│  Show: "You have 65 points!"                        │
│                                                      │
│  ❌ NO DATABASE                                     │
│  ❌ NO API CALL                                     │
│  ✅ INSTANT RESULT                                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Example 2: Login Flow
```
┌─────────────────────────────────────────────────────┐
│ Frontend (Vite + React)                             │
├─────────────────────────────────────────────────────┤
│  User enters:                                        │
│  - Email: user@example.com                          │
│  - Password: ••••••••                               │
│          ↓                                           │
│  Validate format:                                   │
│  - Email format OK ✅                               │
│  - Password not empty ✅                            │
│          ↓                                           │
│  Send to Backend: POST /api/auth/login              │
│  {email, password}                                  │
│                                                      │
└──────────────────────┬────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ Backend (Next.js API)                               │
├─────────────────────────────────────────────────────┤
│  Receive: {email, password}                         │
│          ↓                                           │
│  Find user in database:                             │
│  - Query: SELECT * FROM users WHERE email = ...    │
│  - Result: User found or NOT_FOUND                 │
│          ↓                                           │
│  Validate password:                                 │
│  - Hash entered password                            │
│  - Compare with stored hash                         │
│  - Match? ✅ or ❌                                  │
│          ↓                                           │
│  If valid:                                          │
│  - Create JWT token                                 │
│  - Send back to frontend                           │
│  {token, user}                                      │
│          ↓                                           │
│  If invalid:                                        │
│  - Send error: "Invalid credentials"                │
│                                                      │
└──────────────────────┬────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ Frontend (Vite + React)                             │
├─────────────────────────────────────────────────────┤
│  Receive response:                                   │
│          ↓                                           │
│  If {token}:                                        │
│  - Store token in localStorage                      │
│  - Redirect to dashboard ✅                         │
│          ↓                                           │
│  If {error}:                                        │
│  - Show error message ❌                            │
│  - Ask user to try again                            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Example 3: Payment Processing
```
┌──────────────────────────────────────────────────────────┐
│ Frontend (Vite + React)                                  │
├──────────────────────────────────────────────────────────┤
│  User clicks "Pay Now"                                   │
│  Amount: $5,000                                          │
│  Visa: 189                                               │
│          ↓                                                │
│  Send to Backend:                                        │
│  POST /api/payments/create                              │
│  {visa: '189', amount: 5000}                            │
│                                                           │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│ Backend (Next.js API)                                    │
├──────────────────────────────────────────────────────────┤
│  Receive: {visa, amount}                                │
│          ↓                                                │
│  Validate:                                               │
│  - Check visa exists ✅                                  │
│  - Check amount > 0 ✅                                   │
│  - Check user authenticated ✅                           │
│          ↓                                                │
│  Create Stripe Payment Intent:                          │
│  const intent = await stripe.paymentIntents.create({   │
│    amount: 500000,                    (in cents)         │
│    currency: 'usd',                                      │
│    customer: user.stripe_id                             │
│  });                                                     │
│          ↓                                                │
│  Save to Database:                                       │
│  INSERT INTO payments                                    │
│  (user_id, amount, visa_code, stripe_id)               │
│          ↓                                                │
│  Return to Frontend:                                     │
│  {clientSecret: intent.client_secret}                   │
│                                                           │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│ Frontend (Vite + React) - Stripe.js Library             │
├──────────────────────────────────────────────────────────┤
│  Receive: {clientSecret}                                 │
│          ↓                                                │
│  Display Stripe Payment Form                            │
│  User enters card: 4242 4242 4242 4242                  │
│          ↓                                                │
│  User clicks "Confirm Payment"                          │
│          ↓                                                │
│  Stripe.js handles:                                      │
│  - Encrypt card data                                     │
│  - Send to Stripe servers (NEVER to your server!)       │
│  - Receive confirmation from Stripe                     │
│          ↓                                                │
│  Send to Backend:                                        │
│  POST /api/payments/confirm                            │
│  {paymentIntentId: '...', status: 'succeeded'}         │
│                                                           │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│ Backend (Next.js API)                                    │
├──────────────────────────────────────────────────────────┤
│  Receive: {paymentIntentId, status}                     │
│          ↓                                                │
│  Verify with Stripe:                                     │
│  const intent = await stripe.paymentIntents.retrieve() │
│  Check: intent.status === 'succeeded'                  │
│          ↓                                                │
│  Update Database:                                        │
│  UPDATE payments SET status = 'confirmed'              │
│          ↓                                                │
│  Send Confirmation Email                               │
│  await sendEmail({                                      │
│    to: user.email,                                      │
│    subject: 'Payment Confirmed',                        │
│    amount: amount                                       │
│  });                                                     │
│          ↓                                                │
│  Return to Frontend:                                     │
│  {status: 'success', message: 'Payment processed'}      │
│                                                           │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│ Frontend (Vite + React)                                  │
├──────────────────────────────────────────────────────────┤
│  Show: "Payment Successful! ✅"                         │
│  Redirect to: Dashboard                                  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Example 4: File Upload
```
┌──────────────────────────────────────────────────────────┐
│ Frontend (Vite + React)                                  │
├──────────────────────────────────────────────────────────┤
│  User clicks: "Select file"                              │
│          ↓                                                │
│  Browser opens file picker                              │
│  User selects: passport.pdf (2.5 MB)                    │
│          ↓                                                │
│  Validate on Frontend:                                   │
│  - File size < 10 MB? ✅                                │
│  - File type = PDF? ✅                                  │
│  - Show preview ✅                                       │
│          ↓                                                │
│  Show: "Uploading... 50%"                               │
│          ↓                                                │
│  Send to Backend:                                        │
│  POST /api/uploads/document                            │
│  FormData: {file: passport.pdf}                        │
│                                                           │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│ Backend (Next.js API)                                    │
├──────────────────────────────────────────────────────────┤
│  Receive: FormData with file                            │
│          ↓                                                │
│  Validate:                                               │
│  - File size < 10 MB? ✅                                │
│  - File type = PDF? ✅                                  │
│  - Scan for virus? ✅                                   │
│          ↓                                                │
│  Upload to S3:                                           │
│  const url = await s3.uploadFile({                      │
│    bucket: 'migrationpath-documents',                   │
│    key: `${user.id}/passport.pdf`,                      │
│    file: fileBuffer                                     │
│  });                                                     │
│          ↓                                                │
│  Save to Database:                                       │
│  INSERT INTO documents                                  │
│  (user_id, filename, s3_url, upload_date)              │
│          ↓                                                │
│  Return to Frontend:                                     │
│  {url, documentId: '123'}                              │
│                                                           │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│ Frontend (Vite + React)                                  │
├──────────────────────────────────────────────────────────┤
│  Show: "Upload complete! ✅"                            │
│  Display: "passport.pdf uploaded"                       │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Data Flow for Different Operations

### Simple Calculation (Frontend)
```
Input → Calculate → Output
  ↓
Points: 65
  ↑
No DB, No API
```

### Form Submission (Frontend → Backend)
```
Input → Validate (Frontend) → Send to Backend
                                    ↓
                              Validate (Backend)
                                    ↓
                              Database
                                    ↓
                              Response
                                    ↓
                              Show Result
```

### File Upload (Frontend → Backend → Storage)
```
Select File → Validate → Send
                           ↓
                      Backend Validate
                           ↓
                      Cloud Storage (S3)
                           ↓
                      Database Record
                           ↓
                      Response
                           ↓
                      Show Success
```

### Payment (Frontend → Backend → Stripe)
```
Enter Amount → Send Backend
                    ↓
            Create Intent
                    ↓
        Return clientSecret
                    ↓
        Stripe.js handles card
                    ↓
           Confirm at Backend
                    ↓
           Verify with Stripe
                    ↓
           Update Database
                    ↓
           Send Confirmation
                    ↓
           Show Success
```

---

## Code Pattern Examples

### Pattern 1: Simple Frontend Calculation
```typescript
// ✅ CORRECT - Frontend only
function PointsCalculator() {
  const [age, setAge] = useState('25-32');
  const [english, setEnglish] = useState('proficient');
  
  const points = calculatePoints(age, english);
  
  return <div>Your points: {points}</div>;
}
```

### Pattern 2: Form to Backend
```typescript
// Frontend
async function handleSubmit(formData) {
  const res = await fetch('/api/news', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
  const result = await res.json();
  showSuccessMessage(result);
}

// Backend (Next.js)
export async function POST(req) {
  const data = await req.json();
  
  // Validate
  if (!data.title) return error('Title required');
  
  // Save to DB
  const article = await db.news.create(data);
  
  return success(article);
}
```

### Pattern 3: Payment Flow
```typescript
// Frontend
async function handlePayment() {
  // Step 1: Create intent
  const res = await fetch('/api/payments/create', {
    method: 'POST',
    body: JSON.stringify({amount: 5000})
  });
  const {clientSecret} = await res.json();
  
  // Step 2: Stripe handles card
  const result = await stripe.confirmPayment({
    clientSecret,
    confirmParams: {
      return_url: 'http://localhost:5173/success'
    }
  });
  
  if (result.paymentIntent.status === 'succeeded') {
    // Step 3: Confirm at backend
    await fetch('/api/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({
        paymentIntentId: result.paymentIntent.id
      })
    });
  }
}

// Backend (Next.js)
// POST /api/payments/create
export async function POST(req) {
  const {amount} = await req.json();
  
  // Create with Stripe
  const intent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd'
  });
  
  // Save to DB
  await db.payments.create({
    stripe_id: intent.id,
    amount,
    user_id: req.user.id
  });
  
  return {clientSecret: intent.client_secret};
}

// POST /api/payments/confirm
export async function POST(req) {
  const {paymentIntentId} = await req.json();
  
  // Verify with Stripe
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (intent.status === 'succeeded') {
    // Update DB
    await db.payments.update(paymentIntentId, {
      status: 'confirmed'
    });
    
    // Send email
    await sendConfirmationEmail(req.user.email);
    
    return {status: 'success'};
  }
}
```

---

## Summary Table

| Operation | Where | Why |
|---|---|---|
| Input Form | Frontend | User sees it |
| Format Validation | Frontend | Instant feedback |
| Calculate Points | Frontend | No DB needed |
| Select Visa Type | Frontend | Local state |
| Show Cost Breakdown | Frontend | Pure calculation |
| Validate Against DB | Backend | Security |
| Process Payment | Backend | Stripe API key |
| Create Intent | Backend | Secret key |
| Send Webhook | Backend | Server receives it |
| Save to Database | Backend | Data persistence |
| Send Email | Backend | API key security |
| Upload File | Backend | Validate + Store |
| Create Auth Token | Backend | Secret signing |
| Generate Invoice | Backend | Template rendering |
| Admin Permission Check | Backend | RBAC logic |

---

## Next: Implementation Order

1. **Week 1-2:** Keep calculators on frontend ✅
2. **Week 3-4:** Setup Next.js API structure ✅
3. **Week 5-6:** Implement authentication ✅
4. **Week 7-8:** Add payment processing ✅
5. **Week 9+:** Advanced features ✅

