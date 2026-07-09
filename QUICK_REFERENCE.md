# Quick Reference Guide - MigrationPath Production Architecture

## 🚀 Quick Start Commands

```bash
# Development
bun dev                 # Start dev server
npm run dev            # Alternative

# Build
bun run build          # Production build
npm run build          # Alternative

# Testing
bun test               # Run tests
bun run test:watch     # Watch mode

# Linting
bun lint               # Check code quality
npm run lint           # Alternative

# Preview
bun run preview        # Preview production build
npm run preview        # Alternative
```

---

## 📚 Documentation Files Quick Links

| File | Purpose | When to Use |
|------|---------|------------|
| **ARCHITECTURE_SUMMARY.md** | Complete overview | Starting point - READ FIRST |
| **PRODUCTION_ARCHITECTURE.md** | Detailed architecture | Understanding system design |
| **IMPLEMENTATION_PLAN.md** | 8-week roadmap | Project planning |
| **DEVELOPMENT_GUIDE.md** | Dev setup & guidelines | Daily development |
| **API_DOCUMENTATION.md** | API endpoints & examples | API integration |
| **DEPLOYMENT_GUIDE.md** | Deployment procedures | Going to production |

---

## 🛠️ Creating a New Service

### Template (Copy & Modify):

```typescript
// src/services/myService.ts
import { apiClient } from '@/lib/apiClient';

export interface MyData {
  id: string;
  // ... add fields
}

class MyService {
  private baseURL = '/my-endpoint';

  async getData(): Promise<MyData[]> {
    return apiClient.get<MyData[]>(this.baseURL);
  }

  async createData(data: MyData): Promise<MyData> {
    return apiClient.post<MyData>(this.baseURL, data);
  }
}

export const myService = new MyService();
```

### Using in Component:

```typescript
import { useQuery } from '@tanstack/react-query';
import { myService } from '@/services/myService';

export function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['myData'],
    queryFn: () => myService.getData(),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{/* render data */}</div>;
}
```

---

## 🔒 Security Quick Tips

### Input Validation
```typescript
import { sanitizeInput, validateEmail } from '@/lib/security';

const email = sanitizeInput(userInput);
if (validateEmail(email)) {
  // Safe to use
}
```

### Rate Limiting
```typescript
import { RateLimiter } from '@/lib/security';

const limiter = new RateLimiter(5, 60000); // 5 per minute
if (!limiter.isAllowed(userId)) {
  return { error: 'Too many attempts' };
}
```

### Suspicious Input Detection
```typescript
import { isSuspiciousInput } from '@/lib/security';

if (isSuspiciousInput(userInput)) {
  logSecurityEvent('suspicious_input', { input: userInput });
  return;
}
```

---

## ⚠️ Error Handling Patterns

### Service Error Handling
```typescript
import { AppError, ErrorCodes } from '@/lib/errorHandler';

async function fetchData() {
  try {
    return await apiClient.get('/data');
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === ErrorCodes.UNAUTHORIZED) {
        // Handle auth error
      }
    }
    throw error;
  }
}
```

### Component Error Boundary (Automatic)
```typescript
// Error Boundary is already wrapping App
// Any component error will be caught and displayed
```

---

## 📊 Environment Variables

```bash
# Development (.env.local)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-key
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_ENV=development

# Production (.env.production)
VITE_SUPABASE_URL=https://your-domain.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-key
VITE_API_BASE_URL=https://api.migrationpath.com/api/v1
VITE_ENV=production
```

---

## 🧪 Testing Patterns

### Unit Test Template
```typescript
import { describe, it, expect } from 'vitest';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### Component Test Template
```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

---

## 🔄 API Request/Response Flow

```
1. Component calls service
   ↓
2. Service calls apiClient.get/post/put/delete
   ↓
3. Request Interceptor adds auth token & request ID
   ↓
4. Axios sends request
   ↓
5. Response received
   ↓
6. Response Interceptor checks status
   ↓
7. If error: Handle retry, session, rate limit, etc.
   ↓
8. Component receives data or error
   ↓
9. Component renders or shows error
```

---

## 🎯 Current Services Available

| Service | File | Main Methods |
|---------|------|--------------|
| **Occupation** | `occupationService.ts` | searchOccupations, getOccupation |
| **Authentication** | `authService.ts` | login, register, logout |
| **Documents** | `documentService.ts` | uploadDocument, getUserDocuments |
| **User** | `userService.ts` | getProfile, updateProfile |
| **Points** | `pointsService.ts` | calculatePoints, saveCalculation |

---

## 🚨 Common Issues & Solutions

### Issue: Module not found
```typescript
// ❌ Wrong
import { something } from '../../lib/something';

// ✅ Correct (use @ alias)
import { something } from '@/lib/something';
```

### Issue: TypeScript errors
```bash
# Clear cache and rebuild
rm -rf dist .vite
bun install
bun run build
```

### Issue: API calls failing
1. Check `.env.local` for correct endpoints
2. Check browser console for errors
3. Check network tab in DevTools
4. Verify authentication token

### Issue: Components not updating
```typescript
// ❌ Wrong (state not updated)
data = fetchedData;

// ✅ Correct
const [data, setData] = useState(null);
setData(fetchedData);
```

---

## 📱 Mobile Development

```typescript
import { useIsMobile } from '@/hooks/use-mobile';

export function MyComponent() {
  const isMobile = useIsMobile();
  
  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      {/* Content */}
    </div>
  );
}
```

---

## 🎨 Component Patterns

### Using shadcn/ui Components
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function MyComponent() {
  return (
    <Card>
      <CardContent>
        <Input placeholder="Enter something" />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### Using React Hook Form
```typescript
import { useForm } from 'react-hook-form';

export function MyForm() {
  const { register, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## 🔗 External Resources

- [Vite Docs](https://vitejs.dev)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org)
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com)

---

## 💬 Getting Help

1. **Read the docs** - Check DEVELOPMENT_GUIDE.md first
2. **Check examples** - Look at existing services and components
3. **Search code** - Use Ctrl+F to find similar patterns
4. **Ask team** - Ping team members for specific questions
5. **Create issue** - Document problems for the team

---

## ✅ Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Tests passing locally
- [ ] No console errors or warnings
- [ ] Reviewed error handling
- [ ] Tested critical flows
- [ ] Performance acceptable
- [ ] Security review done
- [ ] Backup strategy in place

---

## 📞 Key Contacts

- **Frontend**: Check DEVELOPMENT_GUIDE.md
- **Backend/API**: Check API_DOCUMENTATION.md
- **Deployment**: Check DEPLOYMENT_GUIDE.md
- **Architecture**: Check PRODUCTION_ARCHITECTURE.md

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready ✅
