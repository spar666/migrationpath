# Backend vs Frontend Architecture Guide

## Current Stack Analysis
- **Frontend:** Vite + React + TypeScript (NOT Next.js)
- **Backend:** Currently using Supabase (PostgreSQL + Auth)
- **Need:** Next.js backend API layer for specific operations

---

## 🎯 What Should Be Handled by Next.js Backend

### 1. **Payment Processing** 💳
**Operations:**
- Stripe payment initiation and webhook handling
- Payment intent creation
- Invoice generation
- Payment tracking and logging
- Refund processing
- PCI compliance handling

**Why Backend?**
- Stripe API keys must be kept secure (never expose in frontend)
- Webhook handling requires server-side verification
- Payment state must be persisted securely
- Sensitive financial data handling

**Endpoints Needed:**
```
POST   /api/payments/create-intent        # Create Stripe payment intent
POST   /api/payments/webhook              # Handle Stripe webhooks
GET    /api/payments/{id}                 # Get payment status
POST   /api/payments/{id}/refund          # Process refunds
POST   /api/invoices/generate             # Generate PDF invoices
```

---

### 2. **User Authentication & Authorization** 🔐
**Operations:**
- Login/Logout logic
- Session management
- JWT token generation/validation
- Password reset/change
- Email verification
- OAuth integration (Google, Microsoft)
- Role-based access control (RBAC)

**Why Backend?**
- Sensitive credential handling
- Session security
- Token signing/verification
- Rate limiting for security
- Audit logging for compliance

**Endpoints Needed:**
```
POST   /api/auth/login                    # User login
POST   /api/auth/signup                   # User registration
POST   /api/auth/logout                   # User logout
POST   /api/auth/refresh-token            # Refresh JWT
POST   /api/auth/forgot-password          # Password reset
POST   /api/auth/verify-email             # Email verification
GET    /api/auth/me                       # Get current user
```

---

### 3. **Email & Communication** 📧
**Operations:**
- Transactional emails (confirmation, receipt, invoice)
- Notification emails (policy updates, invitation status)
- SMS notifications (optional)
- Email templates rendering
- Email delivery tracking
- Unsubscribe management

**Why Backend?**
- Email service API keys must be secure
- SMTP credentials protection
- Email rendering on server side
- Delivery logging and retry logic
- Compliance (CAN-SPAM, GDPR)

**Endpoints Needed:**
```
POST   /api/emails/send                   # Send email
POST   /api/emails/templates              # Email template management
GET    /api/emails/status/{id}            # Track email delivery
POST   /api/notifications/subscribe       # Subscribe to notifications
POST   /api/notifications/unsubscribe     # Unsubscribe
```

---

### 4. **File Upload & Storage** 📁
**Operations:**
- Document upload handling
- Image compression/optimization
- Virus scanning
- Storage to S3/Cloud Storage
- File validation
- Access control for uploaded files
- Temporary file cleanup

**Why Backend?**
- File validation security (can be spoofed on frontend)
- Virus/malware scanning
- Storage access keys must be secure
- File size limits enforced server-side
- Access control implementation

**Endpoints Needed:**
```
POST   /api/uploads/document              # Upload document
POST   /api/uploads/image                 # Upload image
GET    /api/files/{id}                    # Download file
DELETE /api/files/{id}                    # Delete file
POST   /api/uploads/scan                  # Scan for viruses
```

---

### 5. **Data Validation & Business Logic** 🔍
**Operations:**
- Complex validation that depends on database state
- Points calculation with real-time occupation data
- Visa eligibility verification
- Occupation priority checking
- State nomination rules
- Age eligibility verification
- Experience verification

**Why Backend?**
- Business logic security (can't trust client-side validation)
- Requires database context
- Prevents fraud/cheating on eligibility
- Complex calculations need verification
- Real-time data requirements

**Endpoints Needed:**
```
POST   /api/validation/occupation         # Validate occupation
POST   /api/validation/points             # Validate points claim
POST   /api/validation/eligibility        # Check visa eligibility
GET    /api/validation/visa-requirements  # Get current requirements
```

---

### 6. **Data Aggregation & Transformation** 📊
**Operations:**
- Combining data from multiple sources
- Real-time invitation round data
- Trend analysis and statistics
- User analytics calculations
- Dashboard data aggregation
- Report generation

**Why Backend?**
- Performance optimization (don't load all data to frontend)
- Data caching
- Complex queries
- Real-time data updates
- Aggregation logic consistency

**Endpoints Needed:**
```
GET    /api/analytics/dashboard           # Dashboard data
GET    /api/analytics/invitations/trends  # Invitation trends
GET    /api/analytics/occupations/demand  # Occupation demand
GET    /api/reports/user-summary          # User report
```

---

### 7. **Third-Party API Integration** 🔗
**Operations:**
- Government visa API calls
- Occupation list from official sources
- State nomination data fetching
- Exchange rate updates
- Processing time data
- Proxy requests to external APIs

**Why Backend?**
- API rate limiting (don't expose to frontend)
- API key security
- Response transformation/caching
- Error handling consistency
- Request throttling

**Endpoints Needed:**
```
GET    /api/external/visa-times           # Get processing times
GET    /api/external/occupations          # Fetch occupation list
GET    /api/external/state-requirements   # State nomination rules
```

---

### 8. **Admin Operations & Data Management** 🛠️
**Operations:**
- Create/Update/Delete operations (CRUD)
- Bulk data imports
- Admin-only data modifications
- Permission checking
- Audit logging
- Data consistency enforcement

**Why Backend?**
- Admin authentication required
- Sensitive operations require logging
- Data consistency must be enforced
- Concurrent modification handling
- Rollback/transaction support

**Endpoints Needed:**
```
POST   /api/admin/news                    # Create article
PUT    /api/admin/news/{id}               # Update article
DELETE /api/admin/news/{id}               # Delete article
POST   /api/admin/occupations             # Add occupation
PUT    /api/admin/occupations/{id}        # Update occupation
POST   /api/admin/points-logic            # Configure points
POST   /api/admin/config/site             # Update site config
GET    /api/admin/audit-log               # View audit log
```

---

### 9. **Consultation & Booking Management** 📅
**Operations:**
- Consultation booking/scheduling
- Calendar management
- Timezone handling
- Reminder notifications
- Booking confirmations
- Cancellation handling
- Consultant assignment

**Why Backend?**
- Conflict detection (double-booking prevention)
- Timezone conversion
- Notification triggering
- Calendar system integration
- State consistency

**Endpoints Needed:**
```
POST   /api/consultations/book            # Book consultation
GET    /api/consultations/available       # Get availability
PUT    /api/consultations/{id}/reschedule # Reschedule
DELETE /api/consultations/{id}/cancel     # Cancel booking
POST   /api/consultations/{id}/reminder   # Send reminder
```

---

### 10. **Subscription & Billing** 💰
**Operations:**
- Subscription management
- Plan upgrades/downgrades
- Billing cycle management
- Invoice generation
- Credit tracking
- Usage metering
- Churn prevention

**Why Backend?**
- Subscription state must be authoritative
- Billing logic complexity
- Payment gateway integration
- Metered usage tracking
- Fraud prevention

**Endpoints Needed:**
```
POST   /api/subscriptions/create          # Create subscription
PUT    /api/subscriptions/{id}/plan       # Change plan
DELETE /api/subscriptions/{id}/cancel     # Cancel subscription
GET    /api/subscriptions/{id}/usage      # Get usage stats
POST   /api/credits/award                 # Award consultation credits
```

---

## 🟢 What Should Be Simple Frontend Forms (No Backend Needed Yet)

### 1. **Dynamic Points Calculator** 📝
**Operations:**
- User inputs for age, English, education, experience
- Real-time points calculation
- Points display and breakdown
- Suggestions based on points

**Frontend Implementation:**
```typescript
// Components
- AgeSelector (dropdown)
- EnglishLevelSelector (radio buttons)
- EducationSelector (dropdown)
- ExperienceSlider (slider)
- PointsDisplay (calculated, no API call)

// Local State
const [age, setAge] = useState();
const [english, setEnglish] = useState();
const [education, setEducation] = useState();
const [experience, setExperience] = useState();

// Calculate
const points = calculatePoints(age, english, education, experience);
```

**Why Frontend Only:**
- No external data dependencies
- No persistence needed initially
- Pure calculation logic
- User wants instant feedback
- No security concerns

---

### 2. **Visa Quote Calculator** 💵
**Operations:**
- Select visa type
- Checkbox for optional extras
- Consultation credit toggle
- Real-time cost calculation
- Payment milestone breakdown

**Frontend Implementation:**
```typescript
// Components
- VisaTypeSelector (dropdown)
- OptionalExtrasCheckbox
- ConsultationCreditToggle
- CostBreakdown (calculated)
- PaymentMilestones (calculated)

// Local State
const [selectedVisa, setSelectedVisa] = useState();
const [includeExtras, setIncludeExtras] = useState(false);
const [appliedCredit, setAppliedCredit] = useState(true);

// Calculate
const costBreakdown = calculateCost(selectedVisa, includeExtras, appliedCredit);
```

**Why Frontend Only:**
- Static pricing data (from API once loaded)
- No complex logic needed
- Instant user feedback
- No validation against business rules
- No persistence required

---

### 3. **Persona/Pathway Selection** 🎯
**Operations:**
- Select migration pathway (Student, Skilled, etc.)
- Display pathway-specific information
- Show tailored benefits and features

**Frontend Implementation:**
```typescript
// Components
- PersonaSelector (card grid)
- PersonaDetails (description panel)
- PathwayHighlights (feature list)

// Local State
const [selectedPersona, setSelectedPersona] = useState('student');

// No calculation or API needed
```

**Why Frontend Only:**
- Just UI state management
- No data validation needed
- Static content display
- No persistence to DB required

---

### 4. **Questionnaire/Form Entry** ✍️
**Operations:**
- Multi-step form for user information
- Field validation (format only)
- Progress tracking
- Form submission (sends to backend)

**Frontend Implementation:**
```typescript
// Components
- FormStep (multi-step form)
- FormField (input, textarea, etc.)
- ProgressBar
- ValidationMessages (client-side only)

// Validation Examples (Frontend Only):
- Email format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
- Phone format: /^[0-9]{10}$/
- Age: age > 18 && age < 65
- No database lookups needed

// Backend Validation (Later):
- Check if email already registered
- Verify phone number uniqueness
- Verify occupation exists
```

**Why Frontend Only Initially:**
- Format validation is client-side
- Complex validation goes to backend
- Better UX (instant feedback)
- Server validates before saving

---

### 5. **Document/File Selection UI** 📄
**Operations:**
- Display upload form
- Show file selection interface
- Display uploaded file list (local)
- File type/size validation (client-side)

**Frontend Implementation:**
```typescript
// Components
- FileUploadInput
- FilePreview
- FileList
- ProgressBar (during upload)

// Client-side Validation:
- File size check
- File type check
- File count limit

// Backend Handles (later):
- Actual upload to storage
- Virus scanning
- Storage management
```

**Why Frontend Only Initially:**
- UX-level validation
- Real upload handled by backend endpoint
- Progress feedback to user

---

### 6. **Search & Filter UI** 🔍
**Operations:**
- Search by occupation name/code
- Filter by skill level
- Filter by priority status
- Sort results
- Pagination navigation

**Frontend Implementation:**
```typescript
// Components
- SearchInput
- FilterCheckboxes
- SortDropdown
- PaginationButtons

// Local State
const [searchTerm, setSearchTerm] = useState('');
const [filters, setFilters] = useState({});
const [sortBy, setSortBy] = useState('name');
const [page, setPage] = useState(1);

// Frontend Filtering (if small dataset)
const filtered = occupations.filter(o => 
  o.title.includes(searchTerm) &&
  o.skillLevel >= filters.minLevel
);

// Or API Call (if large dataset)
GET /api/occupations?search=${searchTerm}&filters=${JSON.stringify(filters)}
```

**Why Frontend (for now):**
- Simple filters on static data
- Larger dataset → use API

---

### 7. **UI State Management** 🎨
**Operations:**
- Toggle dark/light mode
- Expand/collapse sections
- Show/hide modals
- Navigation state

**Frontend Implementation:**
```typescript
// Components use useState/Context
const [isDarkMode, setIsDarkMode] = useState(false);
const [expandedSections, setExpandedSections] = useState({});

// No API calls needed
// Store in localStorage for persistence
localStorage.setItem('darkMode', isDarkMode);
```

**Why Frontend Only:**
- User preference (not server state)
- Instant feedback needed
- No data consistency issues

---

### 8. **News Article Display** 📰
**Operations:**
- Fetch articles from API
- Display with search/filter
- Show article details
- Comments display (read-only)

**Frontend Implementation:**
```typescript
// Fetch from API once
const { data: articles } = useQuery({
  queryKey: ['articles'],
  queryFn: () => fetch('/api/v1/news').then(r => r.json())
});

// Frontend filtering/searching
const filtered = articles.filter(a => 
  a.title.includes(searchTerm)
);

// Backend handles:
- Storing articles
- Auth for admin editing
```

**Why Frontend Display:**
- Just UI presentation
- API fetching handles data
- No complex logic needed

---

## 📋 Implementation Roadmap

### Phase 1: Basic Frontend Forms (Weeks 1-2)
- ✅ Points Calculator (frontend only)
- ✅ Visa Quote Calculator (frontend only)
- ✅ Persona Selection (frontend only)
- ✅ Simple Forms with client-side validation

**Requires:** No backend changes

### Phase 2: Backend API Setup (Weeks 3-4)
- Create Next.js API routes
- Setup environment variables (Stripe, email, etc.)
- Database schema for users, payments, etc.
- Implement authentication endpoints

**Requires:** 
- Next.js setup
- Environment config
- Database migration

### Phase 3: Payment Integration (Weeks 5-6)
- Stripe integration
- Payment processing endpoints
- Webhook handling
- Invoice generation

**Requires:**
- Stripe account
- Payment table in DB
- Invoice generation service

### Phase 4: Admin Operations (Weeks 7-8)
- Admin authentication
- CRUD endpoints for news, occupations, etc.
- Admin form submission handling
- Audit logging

**Requires:**
- Admin role in DB
- Audit log table
- Form validation

### Phase 5: Advanced Features (Weeks 9+)
- Email/notification system
- File upload handling
- Consultation booking
- Subscription management

---

## 🔒 Security Checklist

### Frontend (Vite + React)
- ❌ DO NOT store API keys
- ❌ DO NOT handle payments directly
- ✅ DO validate input format
- ✅ DO store user preferences locally
- ✅ DO fetch public data from API

### Backend (Next.js)
- ✅ DO store API keys in env variables
- ✅ DO validate all user input
- ✅ DO handle payments securely
- ✅ DO authenticate all requests
- ✅ DO log sensitive operations
- ✅ DO rate limit endpoints
- ✅ DO use HTTPS only

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vite + React)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Points Calculator  ──┐                                       │
│  Quote Calculator   ──┤──► Local State (no API)              │
│  Persona Selector   ──┘                                       │
│                                                               │
│  ┌──────────────────────────────────────────┐                │
│  │ Forms & User Input                       │                │
│  │ (send to backend on submit)              │                │
│  └───────────────┬──────────────────────────┘                │
│                  │                                            │
│                  ↓                                            │
│  ┌──────────────────────────────────────────┐                │
│  │ API Calls to Next.js Backend             │                │
│  │ - Authentication                         │                │
│  │ - File uploads                           │                │
│  │ - Data submission                        │                │
│  │ - Get real-time data                     │                │
│  └──────────────────────────────────────────┘                │
└─────────────────┬──────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────┐
│               NEXT.JS API Backend (/api/*)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Auth Routes         ──┐                                      │
│  Payment Routes      ──┤                                      │
│  Upload Routes       ──┼──► Database (Supabase PostgreSQL)  │
│  Admin Routes        ──┤                                      │
│  Email Routes        ──┼──► External Services                │
│  Data Routes         ──┤   (Stripe, SendGrid, S3, etc.)      │
│  Validation Routes   ──┘                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Key Takeaways

1. **Frontend-Only (Simple Forms):** Use for instant feedback, no persistence needed
2. **Backend Required:** Security, complex logic, external integrations, data consistency
3. **Stripe:** Must ALWAYS be on backend (never expose keys to frontend)
4. **Admin Operations:** Require backend for permission checking and audit logging
5. **Payment Processing:** Entire lifecycle backend-managed
6. **File Uploads:** Validation on client, actual storage on server
7. **User Auth:** Backend-handled session management

---

## 📝 Next Steps

1. Identify which forms users will fill out
2. Create Next.js API routes for each backend operation
3. Add form submission handlers in React components
4. Implement error handling and loading states
5. Add authentication middleware to protected routes
6. Setup Stripe integration for payment processing
7. Implement audit logging for admin operations

