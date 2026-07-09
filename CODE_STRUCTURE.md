# 📖 Code Structure Organization Guide

## Overview

Your codebase is now organized with proper separation of concerns following industry best practices. This guide explains the structure and how to use it.

## Directory Organization

### 1. **`src/types/`** - Centralized Type Definitions

All TypeScript types and interfaces are organized by domain:

```
types/
├── index.ts          # Main export file (re-exports all types)
├── api.ts            # API response types
├── auth.ts           # Authentication types
├── user.ts           # User profile types
├── document.ts       # Document types
├── occupation.ts     # Occupation & job market types
├── points.ts         # Points calculation types
├── news.ts           # News article types
├── visa.ts           # Visa subclass types
├── persona.ts        # User persona types
├── admin.ts          # Admin management types
└── common.ts         # Common utility types
```

**Usage:**
```typescript
// Import types from central location
import type { UserProfile, DocumentType, Occupation } from '@/types';

// Or import specific types
import type { UserProfile } from '@/types/user';
```

### 2. **`src/constants/`** - Application Constants

Configuration and constant values organized by category:

```
constants/
├── index.ts          # Main export file
├── api.ts            # API endpoints & configurations
├── routes.ts         # Application route paths
├── config.ts         # General app configuration
├── validation.ts     # Validation rules & patterns
└── messages.ts       # User-facing strings & messages
```

**Usage:**
```typescript
// Import constants
import { API_ENDPOINTS, ROUTES, MESSAGES, VALIDATION_PATTERNS } from '@/constants';

// Use in code
const endpoint = API_ENDPOINTS.GET_PROFILE;
const route = ROUTES.DASHBOARD;
const message = MESSAGES.LOGIN_SUCCESS;
```

### 3. **`src/utils/`** - Utility Functions

Reusable helper functions organized by purpose:

```
utils/
├── index.ts          # Main export file
├── formatters.ts     # Data formatting (currency, dates, text)
├── validators.ts     # Form & data validation
├── helpers.ts        # General helper utilities
├── date.ts           # Date manipulation functions
└── string.ts         # String manipulation functions
```

**Usage:**
```typescript
// Import utilities
import { formatCurrency, validateEmail, debounce } from '@/utils';

// Use in components
const formatted = formatCurrency(1000); // "$1,000.00"
const isValid = validateEmail('test@example.com'); // true
```

### 4. **`src/context/`** - React Context Providers

Global state management using React Context:

```
context/
├── AuthContext.tsx
├── UserContext.tsx
└── ... (other context providers)
```

**Usage:**
```typescript
// In App.tsx
<AuthProvider>
  <UserProvider>
    <App />
  </UserProvider>
</AuthProvider>

// In components
const { user } = useAuth();
const { profile } = useUser();
```

### 5. **`src/store/`** - State Management Store

Centralized state management (Zustand, Redux, etc.):

```
store/
├── useStore.ts      # Main store
└── ... (feature stores if needed)
```

### 6. **`src/components/`** - React Components

Organized by feature:

```
components/
├── ui/               # Generic UI components
├── layout/           # Layout components
├── admin/            # Admin features
├── auth/             # Authentication
├── dashboard/        # Dashboard
├── consultation/     # Consultation feature
└── ... (other features)
```

### 7. **`src/services/`** - API & Business Logic

Service layer for API communication:

```
services/
├── authService.ts
├── userService.ts
├── occupationService.ts
├── pointsService.ts
├── documentService.ts
└── ... (other services)
```

### 8. **`src/hooks/`** - Custom React Hooks

Custom hooks for component logic:

```
hooks/
├── use-mobile.tsx
├── use-toast.ts
├── useAuthUser.ts
└── ... (other hooks)
```

### 9. **`src/lib/`** - Utility Libraries

Low-level utilities and configurations:

```
lib/
├── apiClient.ts      # Axios instance
├── errorHandler.ts   # Error handling
├── security.ts       # Security utilities
├── imageCompression.ts
└── ... (other libs)
```

### 10. **`src/pages/`** - Page Components

Route handlers and page-level components:

```
pages/
├── Admin.tsx
├── Dashboard.tsx
├── Auth.tsx
└── ... (other pages)
```

### 11. **`src/data/`** - Static Data

Data files for static content:

```
data/
├── occupations.ts
├── newsArticles.ts
├── pathwayPersonas.ts
└── visaSubclasses.ts
```

## Import Conventions

### Barrel Exports
Each folder has an `index.ts` that re-exports public APIs:

```typescript
// ❌ Avoid long imports
import { formatCurrency } from '@/utils/formatters';
import { validateEmail } from '@/utils/validators';

// ✅ Use barrel exports
import { formatCurrency, validateEmail } from '@/utils';
```

### Type Imports
Use TypeScript's `type` keyword for types:

```typescript
// ✅ Correct
import type { UserProfile, DocumentType } from '@/types';
import { useAuth } from '@/hooks';

// ❌ Avoid mixing
import { UserProfile } from '@/types'; // This creates runtime value
```

### Path Aliases
Configure in `tsconfig.json` for clean imports:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

## Usage Examples

### Using Types & Interfaces

```typescript
import type { UserProfile, LoginRequest, AuthResponse } from '@/types';

interface Component {
  user: UserProfile;
  onLogin: (req: LoginRequest) => Promise<AuthResponse>;
}
```

### Using Constants

```typescript
import { API_ENDPOINTS, ROUTES, MESSAGES, VALIDATION_PATTERNS } from '@/constants';

// API calls
const response = await fetch(API_ENDPOINTS.LOGIN);

// Navigation
navigate(ROUTES.DASHBOARD);

// Validation
const isValid = VALIDATION_PATTERNS.EMAIL.test(email);

// User feedback
toast.success(MESSAGES.LOGIN_SUCCESS);
```

### Using Utilities

```typescript
import { 
  formatCurrency, 
  validateEmail, 
  debounce, 
  formatDate,
  toTitleCase 
} from '@/utils';

// Formatting
const price = formatCurrency(1000); // "AUD$1,000.00"
const date = formatDate(new Date()); // "19/03/2026"
const title = toTitleCase('firstName'); // "First Name"

// Validation
const isValid = validateEmail('test@example.com');

// Performance
const debouncedSearch = debounce((query: string) => {
  search(query);
}, 300);
```

### Using Services

```typescript
import { authService } from '@/services/authService';
import { occupationService } from '@/services/occupationService';

// Login
const response = await authService.login({ email, password });

// Search occupations
const results = await occupationService.search({ query });
```

### Using Hooks

```typescript
import { useAuth } from '@/hooks/useAuthUser';
import { useToast } from '@/hooks/use-toast';
import { useOccupationSearch } from '@/hooks/useOccupationSearch';

export function MyComponent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { results } = useOccupationSearch('Developer');

  return (
    <div>
      {user?.email}
      {results.map(occ => <div key={occ.id}>{occ.title}</div>)}
    </div>
  );
}
```

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase with `use` prefix | `useAuthUser.ts` |
| Services | camelCase with `Service` suffix | `authService.ts` |
| Utilities | camelCase | `formatters.ts` |
| Constants | UPPER_SNAKE_CASE | `API_ENDPOINTS` |
| Types | PascalCase | `UserProfile` |
| Folders | kebab-case | `my-component` |

## Best Practices

### 1. Keep Types Organized
- Add new types to appropriate file in `src/types/`
- Update `src/types/index.ts` to re-export

### 2. Use Constants
- Never hardcode strings, numbers, or configurations
- Add to `src/constants/` and import

### 3. Leverage Utilities
- Extract common logic to `src/utils/`
- Write pure, testable functions

### 4. Separation of Concerns
- Components: Rendering logic only
- Hooks: State and side effects
- Services: API communication
- Utils: Pure business logic

### 5. Validation
- Use validators from `src/utils/validators.ts`
- Follow patterns in `src/constants/validation.ts`

### 6. Error Handling
- Use `errorHandler.ts` for consistent error handling
- Return typed error responses

### 7. Message Management
- All user-facing strings in `src/constants/messages.ts`
- Makes i18n (internationalization) easier later

## Maintenance

### Adding a New Feature

1. Create types in `src/types/[feature].ts`
2. Add constants in `src/constants/` as needed
3. Create service in `src/services/[feature]Service.ts`
4. Create hooks in `src/hooks/use[Feature].ts`
5. Create components in `src/components/[feature]/`
6. Create page if needed in `src/pages/[Feature].tsx`

### Adding a New Type
```typescript
// 1. Add to src/types/[domain].ts
export interface MyNewType {
  id: string;
  name: string;
}

// 2. Re-export in src/types/index.ts
export type { MyNewType } from './[domain]';

// 3. Use in code
import type { MyNewType } from '@/types';
```

### Adding a New Utility
```typescript
// 1. Add to src/utils/[category].ts
export const myUtility = (value: string): string => {
  // implementation
};

// 2. Re-export in src/utils/index.ts (already automatic with export * from)

// 3. Use in code
import { myUtility } from '@/utils';
```

## Performance Tips

1. **Code Splitting**: Keep components focused and split large components
2. **Lazy Loading**: Use React.lazy() for route-based code splitting
3. **Memoization**: Use `useMemo` and `useCallback` appropriately
4. **Debouncing**: Use debounce utility for search and form inputs
5. **Caching**: Leverage HTTP cache headers and React Query caching

## Testing

Organize tests alongside their source:

```
hooks/
├── useAuthUser.ts
└── useAuthUser.test.ts

utils/
├── validators.ts
└── validators.test.ts
```

## Next Steps

1. ✅ Folder structure created
2. ✅ Type definitions organized
3. ✅ Constants centralized
4. ✅ Utilities structured
5. ⏳ Migrate existing code to new structure
6. ⏳ Update import statements
7. ⏳ Add more utilities as needed

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Best Practices](https://react.dev/learn)
- [Clean Code Principles](https://en.wikipedia.org/wiki/Code_smell)
