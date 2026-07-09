# Development Guide

## Getting Started

### Prerequisites

- Node.js 18+
- Bun (package manager) or npm
- Supabase local development environment (optional)

### Installation

```bash
# Install dependencies
bun install
# or
npm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your configuration
```

### Running Development Server

```bash
# Start development server
bun dev
# or
npm run dev

# Server runs on http://localhost:8080
```

### Building for Production

```bash
# Build the project
bun run build
# or
npm run build

# Preview production build
bun run preview
# or
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn-ui components
│   ├── admin/          # Admin panel components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard components
│   └── ...
├── pages/              # Page components (routes)
├── services/           # API service layer
│   ├── occupationService.ts
│   ├── authService.ts
│   └── ...
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
│   ├── apiClient.ts    # Axios instance with interceptors
│   ├── errorHandler.ts # Error handling utilities
│   └── utils.ts        # General utilities
├── data/               # Static data
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

## Adding New Features

### 1. Creating a New Service

Create a new file in `src/services/`:

```typescript
// src/services/myService.ts
import { apiClient } from '@/lib/apiClient';

class MyService {
  async fetchData() {
    return apiClient.get('/my-endpoint');
  }
}

export const myService = new MyService();
```

### 2. Creating a New Hook

Create a new file in `src/hooks/`:

```typescript
// src/hooks/useMyData.ts
import { useState, useEffect } from 'react';
import { myService } from '@/services/myService';

export function useMyData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await myService.fetchData();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}
```

### 3. Creating a New Component

```typescript
// src/components/MyComponent.tsx
import { Button } from '@/components/ui/button';
import { useMyData } from '@/hooks/useMyData';

export function MyComponent() {
  const { data, loading, error } = useMyData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>My Component</h1>
      {/* Component content */}
    </div>
  );
}
```

## Code Style Guidelines

### TypeScript

- Always use `interface` for object types
- Use strict type annotations
- Avoid `any` type
- Use proper error types

### React

- Use functional components with hooks
- Extract components for reusability
- Prop drilling should be minimal
- Use custom hooks for complex logic

### Naming Conventions

- Components: `PascalCase` (e.g., `MyComponent`)
- Hooks: `camelCase` with `use` prefix (e.g., `useMyData`)
- Services: `camelCase` (e.g., `myService`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- Files: Match export name (e.g., `MyComponent.tsx`)

## Testing

### Running Tests

```bash
# Run all tests once
bun test
# or
npm test

# Run tests in watch mode
bun run test:watch
# or
npm run test:watch
```

### Writing Tests

```typescript
// Component.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Linting

```bash
# Run ESLint
bun lint
# or
npm run lint
```

## Debugging

### Browser DevTools

1. Open browser DevTools (F12)
2. Check Console for errors
3. Use React DevTools extension
4. Set breakpoints in Sources tab

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:8080",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

## Performance Tips

1. **Code Splitting**: Use React.lazy() for route-based splitting
2. **Memoization**: Use React.memo() for expensive components
3. **Bundle Analysis**: Use Vite's build analysis
4. **Lazy Loading**: Load images and heavy components on demand
5. **Query Caching**: Leverage React Query caching

## Environment Setup

### Local Supabase

```bash
# Start Supabase locally
supabase start

# Run migrations
supabase migration up

# Stop Supabase
supabase stop
```

### Database

- Supabase provides PostgreSQL database
- Migrations are in `supabase/migrations/`
- Use Supabase CLI for schema changes

## Deployment

See `DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

## Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install
bun run build
```

### Dev Server Not Starting

- Check port 8080 is available
- Check `.env.local` configuration
- Clear Vite cache: `rm -rf .vite`

### API Errors

- Check network tab in DevTools
- Verify API endpoint in `.env.local`
- Check authentication token expiry
- Review error logs in console

## Getting Help

- Check existing issues in GitHub
- Review API documentation: `API_DOCUMENTATION.md`
- Check architecture: `PRODUCTION_ARCHITECTURE.md`
- Ask team members in Slack/Teams

## Useful Resources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Supabase Documentation](https://supabase.com/docs)
