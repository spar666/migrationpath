# 🎬 Login Feature - Visual Implementation Guide

## 📺 What Happened

### Before
```
Frontend Auth.tsx
├─ Form: ✅ Email, Password inputs
├─ UI: ✅ Beautiful glassmorphic design
├─ Submit: ❌ Does nothing (TODO)
└─ Result: ❌ Shows error toast
```

### After
```
Frontend Auth.tsx
├─ Form: ✅ Email, Password inputs
├─ UI: ✅ Beautiful glassmorphic design
├─ Submit: ✅ Sends API request
├─ API Call: POST /api/v1/auth/signin
├─ Token Storage: ✅ localStorage.setItem('authToken', token)
├─ Redirect: ✅ /dashboard or /admin based on role
└─ Result: ✅ User logged in!
```

---

## 🔄 Request/Response Flow

### Request (Frontend Sends)
```json
POST /api/v1/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response (Backend Returns)
```json
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: authToken=eyJ...; HttpOnly; Secure; SameSite=Strict

{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe",
    "personaType": "skilled",
    "isAdmin": false
  }
}
```

---

## 🎯 Step-by-Step User Journey

### 1. User Arrives at Login Page
```
┌─────────────────────────────────────┐
│  /auth?intent=login                 │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ Welcome Back                 │  │
│  │                              │  │
│  │ Email: [_______________]     │  │
│  │ Password: [_______________]  │  │
│  │                              │  │
│  │ [     Sign In     ]          │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 2. User Enters Credentials
```
┌─────────────────────────────────────┐
│  /auth?intent=login                 │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ Welcome Back                 │  │
│  │                              │  │
│  │ Email: [user@example.com___] │  │
│  │ Password: [••••••••]         │  │
│  │                              │  │
│  │ [     Sign In     ]          │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 3. User Clicks Sign In
```
Frontend Code Executes:
↓
handleSubmit()
↓
Validate email & password (non-empty)
↓
setIsLoading(true)
↓
fetch('/api/v1/auth/signin', {
  method: 'POST',
  body: { email, password }
})
↓
Show spinner: [⊙] Signing in...
```

### 4. Request Sent to Backend
```
┌──────────────────────────────────┐
│  Frontend (localhost:5173)        │
│  ┌────────────────────────────┐  │
│  │  Sending...                │  │
│  │  POST /api/v1/auth/signin  │  │
│  │  { email, password }       │  │
│  └────────────────────────────┘  │
│              ↓ HTTP POST          │
└──────────────────────────────────┘
         (Network)
┌──────────────────────────────────┐
│  Backend (localhost:3001)         │
│  ┌────────────────────────────┐  │
│  │  POST /api/v1/auth/signin  │  │
│  │  Received:                 │  │
│  │  - email                   │  │
│  │  - password                │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### 5. Backend Validates Credentials
```
Backend Code Executes:
↓
Find user: SELECT * FROM users WHERE email = ?
↓
User found? YES ✅
↓
Check password: bcrypt.compare(password, hash)
↓
Password correct? YES ✅
↓
Email verified? YES ✅
↓
Generate token: jwt.sign({id, email}, SECRET)
↓
Return: {
  success: true,
  token: "eyJ...",
  isAdmin: false
}
```

### 6. Response Sent Back to Frontend
```
┌──────────────────────────────────┐
│  Backend (localhost:3001)         │
│  ┌────────────────────────────┐  │
│  │  Sending Response...       │  │
│  │  HTTP 200 OK               │  │
│  │  {                         │  │
│  │    token: "eyJ...",        │  │
│  │    isAdmin: false          │  │
│  │  }                         │  │
│  └────────────────────────────┘  │
│              ↓ HTTP RESPONSE      │
└──────────────────────────────────┘
         (Network)
┌──────────────────────────────────┐
│  Frontend (localhost:5173)        │
│  ┌────────────────────────────┐  │
│  │  Response Received! ✅      │  │
│  │  token = "eyJ..."          │  │
│  │  isAdmin = false           │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### 7. Frontend Processes Response
```
Frontend Code Continues:
↓
if (!response.ok) {
  Show error toast ❌
  Return
}
↓
data = response.json()
↓
if (data.token) {
  localStorage.setItem('authToken', data.token)
  ✅ Token saved!
}
↓
Show success toast: "Login successful!"
↓
Redirect:
if (data.isAdmin) {
  navigate('/admin')
} else {
  navigate('/dashboard')
}
```

### 8. User Redirected to Dashboard
```
┌─────────────────────────────────┐
│  /dashboard                     │
│                                 │
│  ┌──────────────────────────┐  │
│  │  Your Migration Strategy  │  │
│  │  ✅ LOGGED IN             │  │
│  │                          │  │
│  │  User: John Doe          │  │
│  │  Pathway: Skilled        │  │
│  │  Points: 85/100          │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
```

---

## 🔴 Error Scenarios

### Scenario 1: Wrong Password
```
User enters:
- Email: test@example.com ✅
- Password: wrongpassword ❌

Backend:
↓
User found? YES
↓
bcrypt.compare(wrongpassword, hash)? NO
↓
Return HTTP 401:
{
  success: false,
  message: "Invalid email or password"
}

Frontend:
↓
Show error toast: ❌ "Invalid email or password"
↓
Form stays visible
↓
User can retry
```

### Scenario 2: User Not Found
```
User enters:
- Email: nouser@example.com ❌
- Password: password123

Backend:
↓
SELECT * FROM users WHERE email = ?
↓
No result
↓
Return HTTP 401:
{
  success: false,
  message: "Invalid email or password"
}

Frontend:
↓
Show error toast: ❌ "Invalid email or password"
↓
Form stays visible
↓
User can retry
```

### Scenario 3: Email Not Verified
```
User enters:
- Email: unverified@example.com
- Password: password123

Backend:
↓
User found? YES
✓
Password correct? YES
✓
email_verified_at = NULL ❌
↓
Return HTTP 403:
{
  success: false,
  message: "Please verify your email first"
}

Frontend:
↓
Show error toast: ❌ "Please verify your email first"
↓
User can try again after email verification
```

### Scenario 4: Server Error
```
Backend:
↓
Database connection fails ❌
↓
Catch error
↓
Return HTTP 500:
{
  success: false,
  message: "An error occurred during login"
}

Frontend:
↓
Show error toast: ❌ "Authentication failed"
↓
User can retry
↓
Check server logs for actual error
```

---

## 🔑 Token Lifecycle

```
1. Generated (Backend)
   └─ jwt.sign({id, email, isAdmin}, SECRET)
   └─ Expires in 24 hours

2. Sent (Backend → Frontend)
   └─ In HTTP response JSON
   └─ Also in Set-Cookie header (HttpOnly)

3. Stored (Frontend)
   └─ localStorage.setItem('authToken', token)
   └─ Cookie also stored automatically

4. Used (Frontend → Backend)
   └─ Authorization header: Bearer token
   └─ Or sent in cookie automatically

5. Validated (Backend)
   └─ jwt.verify(token, SECRET)
   └─ Decode and get user info

6. Expired (After 24h)
   └─ Frontend makes request with old token
   └─ Backend returns 401 "Token expired"
   └─ Frontend redirects to /auth

7. Cleared (Logout)
   └─ Frontend: localStorage.removeItem('authToken')
   └─ Frontend: Navigate to /auth
   └─ Backend: Clear cookie
```

---

## 📊 Code Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   Auth.tsx - handleSubmit()                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 1. Validate Inputs                                     │    │
│  │    - email: non-empty                                  │    │
│  │    - password: non-empty                               │    │
│  │    - password match (if signup)                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 2. Set Loading State                                   │    │
│  │    setIsLoading(true)                                  │    │
│  │    Show: [⊙] Signing in...                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 3. Check Login vs Signup                               │    │
│  │    if (isLogin) → Login flow                           │    │
│  │    else → Signup flow                                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 4. Send API Request                                    │    │
│  │    POST /api/v1/auth/signin                            │    │
│  │    { email, password }                                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 5. Check Response Status                               │    │
│  │    if (!response.ok)                                   │    │
│  │    → Throw error with message                          │    │
│  │    else → Parse JSON                                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 6. Store Token                                         │    │
│  │    localStorage.setItem('authToken', token)            │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 7. Show Success Toast                                  │    │
│  │    "Login successful!"                                 │    │
│  │    "Redirecting to your dashboard..."                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 8. Redirect Based on Role                              │    │
│  │    if (data.isAdmin)                                   │    │
│  │    → navigate('/admin')                                │    │
│  │    else                                                │    │
│  │    → navigate('/dashboard')                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 9. Error Handling                                      │    │
│  │    if (error)                                          │    │
│  │    → Show error toast                                  │    │
│  │    → Keep form visible                                 │    │
│  │    → User can retry                                    │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 10. Finally Block                                      │    │
│  │     setIsLoading(false)                                │    │
│  │     Hide spinner                                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎓 Key Takeaways

### What Frontend Does
1. ✅ Collects email and password from user
2. ✅ Validates inputs
3. ✅ Sends POST request to API
4. ✅ Receives JWT token
5. ✅ Stores token locally
6. ✅ Redirects to appropriate page

### What Backend Must Do
1. 📝 Receive POST request
2. 📝 Validate email format
3. 📝 Find user in database
4. 📝 Hash-verify password
5. 📝 Generate JWT token
6. 📝 Send response with token

### What Happens Next
1. On every subsequent request, token is sent
2. Backend validates token
3. If valid, request is allowed
4. If invalid/expired, redirect to login

---

## ✨ Summary

**Frontend Status:** ✅ COMPLETE AND WORKING
**Backend Status:** 📚 READY TO IMPLEMENT
**Integration:** 🔗 Ready for connection

The frontend is fully functional and waiting for the backend endpoint.
All you need to do is implement `/api/v1/auth/signin` and it will work! 🚀
