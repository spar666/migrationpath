/**
 * Application Routes
 * Aligned with actual App.tsx router configuration
 */

export const ROUTES = {
  // Public Routes
  HOME: '/',
  AUTH: '/auth',

  // Protected Routes
  DASHBOARD: '/dashboard',

  // Feature Routes
  OCCUPATION_SEARCH: '/occupation-search',
  POINTS_CALCULATOR: '/points-calculator',
  QUOTE: '/quote',
  NEWS: '/news',
  NEWS_ARTICLE: '/news/:slug',

  // Pathway Routes
  PATHWAY_STUDENT: '/pathways/student',
  PATHWAY_SKILLED: '/pathways/skilled',
  PATHWAY_PARTNER: '/pathways/partner',
  PATHWAY_ONSHORE: '/pathways/onshore',
  PATHWAY_EMPLOYER: '/pathways/employer',

  // Admin Routes
  ADMIN: '/admin',

  // Error Routes
  NOT_FOUND: '*',
} as const;

// Route groups for navigation
export const ROUTE_GROUPS = {
  PUBLIC: [ROUTES.HOME, ROUTES.AUTH, ROUTES.NEWS, ROUTES.OCCUPATION_SEARCH, ROUTES.POINTS_CALCULATOR],
  PROTECTED: [ROUTES.DASHBOARD],
  ADMIN: [ROUTES.ADMIN],
  PATHWAYS: [
    ROUTES.PATHWAY_STUDENT,
    ROUTES.PATHWAY_SKILLED,
    ROUTES.PATHWAY_PARTNER,
    ROUTES.PATHWAY_ONSHORE,
    ROUTES.PATHWAY_EMPLOYER,
  ],
} as const;
