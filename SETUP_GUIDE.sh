#!/bin/bash

# ============================================
# Quick Setup & Reference for New Structure
# ============================================

# 1. FOLDER STRUCTURE SUMMARY
# ============================================

cat << 'EOF'

📁 CODE STRUCTURE - QUICK REFERENCE

src/
├── types/                # ✅ NEW - Centralized types
│   ├── index.ts         # Re-exports all types
│   ├── api.ts           # API response types
│   ├── auth.ts          # Auth types
│   ├── user.ts          # User types
│   ├── document.ts      # Document types
│   ├── occupation.ts    # Occupation types
│   ├── points.ts        # Points types
│   ├── news.ts          # News types
│   ├── visa.ts          # Visa types
│   ├── persona.ts       # Persona types
│   ├── admin.ts         # Admin types
│   └── common.ts        # Common types
│
├── constants/           # ✅ NEW - App constants
│   ├── index.ts         # Re-exports all constants
│   ├── api.ts           # API endpoints
│   ├── routes.ts        # Route paths
│   ├── config.ts        # App configuration
│   ├── validation.ts    # Validation rules
│   └── messages.ts      # User messages
│
├── utils/               # ✅ NEW - Utility functions
│   ├── index.ts         # Re-exports all utils
│   ├── formatters.ts    # Data formatting
│   ├── validators.ts    # Data validation
│   ├── helpers.ts       # Helper functions
│   ├── date.ts          # Date utilities
│   └── string.ts        # String utilities
│
├── context/             # ✅ NEW - React Context
│   ├── AuthContext.tsx
│   └── UserContext.tsx
│
├── store/               # ✅ NEW - State Management
│   └── useStore.ts
│
├── components/          # React Components (organized by feature)
├── services/            # API & Business Logic
├── hooks/               # Custom React Hooks
├── lib/                 # Utility Libraries
├── pages/               # Page Components
├── data/                # Static Data
└── integrations/        # Third-party Integrations

EOF

# 2. COMMON IMPORT PATTERNS
# ============================================

cat << 'EOF'

📥 IMPORT PATTERNS

✅ Types
import type { UserProfile, Occupation } from '@/types';
import type { UserProfile } from '@/types/user';

✅ Constants
import { API_ENDPOINTS, ROUTES, MESSAGES } from '@/constants';
import { VALIDATION_PATTERNS } from '@/constants/validation';

✅ Utilities
import { formatCurrency, validateEmail, debounce } from '@/utils';
import { formatDate, addDays } from '@/utils/date';

✅ Services
import { authService } from '@/services/authService';
import { occupationService } from '@/services/occupationService';

✅ Hooks
import { useAuth } from '@/hooks/useAuthUser';
import { useToast } from '@/hooks/use-toast';

✅ Components
import { UserCard } from '@/components/dashboard';
import { Button } from '@/components/ui/button';

EOF

# 3. USAGE EXAMPLES
# ============================================

cat << 'EOF'

💡 USAGE EXAMPLES

// 1. Formatting with utils
const formatted = formatCurrency(1000);        // "AUD$1,000.00"
const date = formatDate(new Date());           // "19/03/2026"
const title = toTitleCase('firstName');        // "First Name"

// 2. Validation with utils
const isValid = validateEmail('test@example.com');
const hasStrongPassword = validatePassword(pwd);

// 3. Using constants for API calls
const response = await fetch(API_ENDPOINTS.LOGIN);

// 4. Navigation with route constants
navigate(ROUTES.DASHBOARD);

// 5. User messages from constants
toast.success(MESSAGES.LOGIN_SUCCESS);

// 6. Validation patterns for forms
const isValidEmail = VALIDATION_PATTERNS.EMAIL.test(email);

// 7. Custom hooks for state
const { user } = useAuth();
const { results } = useOccupationSearch('Developer');

// 8. Types for type-safe code
interface LoginProps {
  onSuccess: (response: AuthResponse) => void;
}

EOF

# 4. FILE NAMING CONVENTIONS
# ============================================

cat << 'EOF'

📝 FILE NAMING CONVENTIONS

Components      → PascalCase          UserProfile.tsx
Hooks           → camelCase + 'use'   useAuthUser.ts
Services        → camelCase + 'Service' authService.ts
Utilities       → camelCase           formatters.ts
Constants       → UPPER_SNAKE_CASE   API_ENDPOINTS
Types           → PascalCase          UserProfile
Folders         → kebab-case          my-component

EOF

# 5. ADDING NEW FEATURES
# ============================================

cat << 'EOF'

🚀 ADDING A NEW FEATURE - CHECKLIST

1. Create types:
   src/types/myfeature.ts
   ↓
   Add to src/types/index.ts

2. Add constants (if needed):
   src/constants/... (add to relevant file)
   ↓
   Automatically re-exported from index.ts

3. Create service:
   src/services/myFeatureService.ts

4. Create hooks (if needed):
   src/hooks/useMyFeature.ts

5. Create components:
   src/components/myfeature/MyComponent.tsx

6. Create page (if needed):
   src/pages/MyFeature.tsx

7. Add route:
   src/constants/routes.ts → ROUTES.MY_FEATURE = '/my-feature'

EOF

# 6. VALIDATION HELPERS
# ============================================

cat << 'EOF'

✔️  VALIDATION EXAMPLES

import { validateEmail, validatePassword, validateField } from '@/utils';
import { VALIDATION_PATTERNS, FIELD_LENGTH_LIMITS } from '@/constants';

// Simple validation
const isValidEmail = validateEmail('test@example.com');
const isStrongPassword = validatePassword('MyPass123!@#');

// Pattern matching
const matches = VALIDATION_PATTERNS.PHONE.test('+61 2 1234 5678');

// Field validation with rules
const result = validateField('myfield', {
  required: true,
  minLength: 3,
  maxLength: 50,
  pattern: /^[a-zA-Z]+$/
});

if (!result.valid) {
  console.error(result.message);
}

EOF

# 7. DEBUGGING TIPS
# ============================================

cat << 'EOF'

🐛 DEBUGGING TIPS

1. Check types:
   - Hover over variable in VSCode to see inferred type
   - Use 'type' keyword for cleaner imports

2. Use Constants:
   - Search for string usage: grep -r "API_ENDPOINTS"
   - Refactor to use constants instead of hardcoded strings

3. Validate early:
   - Use validators before API calls
   - Check VALIDATION_PATTERNS for regex patterns

4. Log with context:
   - Use messages from MESSAGES constant
   - Include user-friendly error messages

5. Review imports:
   - Use barrel exports (from '@/utils')
   - Avoid importing from deep paths

EOF

# 8. CONFIGURATION FILES TO UPDATE
# ============================================

cat << 'EOF'

⚙️  RECOMMENDED CONFIGURATION UPDATES

tsconfig.json:
  - Ensure "baseUrl": "." and paths "@/*": ["src/*"]
  - Consider "strict": true for better type safety

eslint.config.js:
  - Add rules for import ordering
  - Consider import-plugin for sorting imports

vite.config.ts:
  - Alias configured for @ pointing to src
  - Tree-shaking enabled for unused code removal

EOF

