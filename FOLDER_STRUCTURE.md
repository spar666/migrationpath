# 📁 Folder Structure Guide

## Project Organization

```
migrationpath-60ba5ed1/
├── src/
│   ├── components/              # React components
│   │   ├── ui/                 # Generic UI components (Button, Input, Card, etc)
│   │   ├── layout/             # Layout components (Header, Footer, Sidebar)
│   │   ├── admin/              # Admin-specific components
│   │   ├── auth/               # Auth-related components
│   │   ├── consultation/       # Consultation feature components
│   │   ├── course/             # Course feature components
│   │   ├── dashboard/          # Dashboard feature components
│   │   ├── home/               # Home page components
│   │   ├── news/               # News feature components
│   │   ├── onshore/            # Onshore pathway components
│   │   ├── prospectus/         # Prospectus components
│   │   ├── quote/              # Quote feature components
│   │   ├── search/             # Search feature components
│   │   └── wizard/             # Wizard/wizard flow components
│   │
│   ├── pages/                  # Page components (route handlers)
│   │   ├── Admin.tsx
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Index.tsx
│   │   ├── News.tsx
│   │   ├── NewsArticle.tsx
│   │   ├── NotFound.tsx
│   │   ├── OccupationSearch.tsx
│   │   ├── PointsCalculator.tsx
│   │   ├── Quote.tsx
│   │   └── pathways/
│   │
│   ├── services/               # API & business logic
│   │   ├── authService.ts
│   │   ├── documentService.ts
│   │   ├── occupationService.ts
│   │   ├── pointsService.ts
│   │   └── userService.ts
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useAdminAuth.ts
│   │   ├── useAdminDocuments.ts
│   │   ├── useAdminUsers.ts
│   │   ├── useOccupationSearch.ts
│   │   ├── useOccupationThreshold.ts
│   │   ├── usePointsConfig.ts
│   │   ├── useQuestionnaireStatus.ts
│   │   └── useUserDocuments.ts
│   │
│   ├── lib/                    # Utility functions
│   │   ├── apiClient.ts        # Axios configuration
│   │   ├── axios.ts            # Axios setup
│   │   ├── errorHandler.ts     # Error handling utilities
│   │   ├── imageCompression.ts # Image utilities
│   │   ├── security.ts         # Security utilities
│   │   └── utils.ts            # General utilities
│   │
│   ├── types/                  # TypeScript type definitions (NEW)
│   │   ├── index.ts
│   │   ├── api.ts             # API response types
│   │   ├── domain.ts          # Domain models
│   │   ├── common.ts          # Common types
│   │   └── ...
│   │
│   ├── constants/              # App constants (NEW)
│   │   ├── index.ts
│   │   ├── api.ts             # API endpoints
│   │   ├── routes.ts          # Route paths
│   │   ├── config.ts          # App configuration
│   │   └── ...
│   │
│   ├── context/                # React Context (NEW)
│   │   ├── AuthContext.tsx
│   │   ├── UserContext.tsx
│   │   └── ...
│   │
│   ├── store/                  # State management (NEW)
│   │   ├── useStore.ts        # Zustand/Redux store
│   │   └── ...
│   │
│   ├── utils/                  # Utility functions (NEW)
│   │   ├── index.ts
│   │   ├── formatters.ts      # Data formatters
│   │   ├── validators.ts      # Form validators
│   │   └── helpers.ts         # Helper functions
│   │
│   ├── data/                   # Static data
│   │   ├── newsArticles.ts
│   │   ├── occupations.ts
│   │   ├── pathwayPersonas.ts
│   │   └── visaSubclasses.ts
│   │
│   ├── integrations/           # Third-party integrations
│   │   └── supabase/
│   │
│   ├── test/                   # Test files
│   │   ├── example.test.ts
│   │   └── setup.ts
│   │
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
│
├── supabase/                   # Supabase migrations & config
│   ├── config.toml
│   └── migrations/
│
├── public/                     # Static assets
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── eslint.config.js
├── vitest.config.ts
└── ... (documentation files)
```

## Folder Purposes

### `src/components`
- **Reusable React components**
- Organized by feature
- UI components in `ui/` subfolder
- Each component should be self-contained

### `src/pages`
- **Page-level components**
- One per route/page
- Can compose multiple smaller components

### `src/services`
- **API calls & business logic**
- One service per domain
- Handles API communication

### `src/hooks`
- **Custom React hooks**
- Reusable stateful logic
- Follow `use*` naming convention

### `src/lib`
- **Utility functions & helpers**
- Shared utilities across the app
- No component logic

### `src/types` ⭐ NEW
- **TypeScript type definitions**
- Centralized type management
- API types, domain models, DTOs

### `src/constants` ⭐ NEW
- **App constants**
- API endpoints, routes, configuration
- Magic strings/numbers

### `src/context` ⭐ NEW
- **React Context providers**
- Global state (auth, user, theme)
- For cross-cutting concerns

### `src/store` ⭐ NEW
- **State management**
- Zustand, Redux, or similar
- For complex application state

### `src/utils` ⭐ NEW
- **Helper utilities**
- Formatters, validators, general helpers
- Organized by purpose

### `src/data`
- **Static data files**
- Configuration data
- Mock data for development

### `src/integrations`
- **Third-party service integrations**
- Supabase, Firebase, etc.
- Abstraction layer for external services

## Best Practices

1. **Index files**: Create `index.ts` files to expose public APIs
2. **Naming**: Use kebab-case for folders, PascalCase for components, camelCase for functions
3. **Imports**: Import from barrel exports when possible
4. **Co-location**: Keep related files close together
5. **Separation of concerns**: Separate UI from business logic

## Example Import Patterns

```typescript
// From components
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { UserCard } from '@/components/dashboard'

// From hooks
import { useAuthUser } from '@/hooks/useAuthUser'
import { useToast } from '@/hooks/use-toast'

// From services
import { authService } from '@/services/authService'

// From types
import type { User, Occupation } from '@/types'

// From constants
import { API_ENDPOINTS, ROUTES } from '@/constants'

// From utils
import { formatDate, validateEmail } from '@/utils'
```

## Migration Checklist

- [ ] Move shared types to `src/types/`
- [ ] Consolidate constants to `src/constants/`
- [ ] Create context providers in `src/context/`
- [ ] Add utility helpers to `src/utils/`
- [ ] Update import statements across codebase
- [ ] Create index.ts barrel exports for each folder
- [ ] Update path aliases in `tsconfig.json` if needed
