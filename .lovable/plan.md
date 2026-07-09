

# Homepage UI/UX Enhancement Plan

## Current State
The homepage has good bones -- correct color palette (Navy, Gold, Glacier, Cloud White), solid section structure, and proper component architecture. However, several UX issues reduce the premium feel and usability.

## Issues Identified

1. **Excessive vertical spacing** between sections creates a disconnected, "empty" feel -- especially between Courses and News sections, and between News and Final CTA
2. **Invitation ticker is too dense** -- cards are cramped with too much inline data, hard to scan
3. **Visa Grants section shows 6 cards in a flat grid** -- no hierarchy or featured treatment
4. **"Why MigrationPath" section** feels generic -- 3 identical cards with no visual differentiation
5. **Course cards lack visual warmth** -- no university logos/colors, all look identical
6. **News section** has excessive top padding creating a visual gap
7. **Final CTA section** has too much empty space above/below
8. **Mobile bottom nav** links to `/search` and `/profile` which don't exist as routes
9. **Section transitions feel abrupt** -- no visual rhythm between alternating bg colors

## Planned Changes

### 1. Tighten Section Spacing (Index.tsx + individual sections)
- Reduce excessive `py-24 md:py-32` on CoursesSection to `py-16 md:py-20` to match other sections
- Reduce FinalCTA padding from `py-20 md:py-28` to `py-16 md:py-24`
- Ensure consistent vertical rhythm across all sections

### 2. Improve Invitation Ticker (InvitationFeed.tsx)
- Add subtle separator dots between data points for better scannability
- Slightly increase card padding for breathing room
- Add a subtle hover pause on the ticker animation

### 3. Enhance Visa Grants Feed (VisaGrantsFeed.tsx)
- Feature the first card larger (span 2 columns on desktop) to create visual hierarchy
- Limit to 4 cards (2x2 grid) for a cleaner, less overwhelming layout
- Add a "View all grants" link

### 4. Elevate "Why MigrationPath" Section (WhyMigrationPath.tsx)
- Add a numbered step indicator (01, 02, 03) for visual differentiation
- Add a subtle top-border accent color per card for variety
- Make the section feel more like a value progression

### 5. Add Visual Warmth to Course Cards (CourseCard.tsx)
- Add a colored top-border strip (using accent for regional, primary for metro)
- Slightly increase title font weight for scan-ability

### 6. Fix News Section Spacing (NewsFeedSection.tsx)
- Reduce top padding to create tighter visual connection with courses above

### 7. Fix Mobile Bottom Nav Routes (MobileBottomNav.tsx)
- Change `/search` to `/occupation-search`
- Change `/profile` to `/auth` (or dashboard)

### 8. Add Section Dividers for Visual Rhythm
- Add subtle gradient dividers between key sections in Index.tsx to create smoother transitions

## Technical Details

### Files to modify:
- `src/pages/Index.tsx` -- add subtle section separators
- `src/components/home/InvitationFeed.tsx` -- improve card spacing and readability
- `src/components/home/VisaGrantsFeed.tsx` -- add hierarchy with featured card
- `src/components/home/WhyMigrationPath.tsx` -- add numbered steps and top accents
- `src/components/home/CourseCard.tsx` -- add colored top border
- `src/components/home/CoursesSection.tsx` -- tighten spacing
- `src/components/home/NewsFeedSection.tsx` -- reduce padding
- `src/components/home/FinalCTA.tsx` -- tighten spacing
- `src/components/layout/MobileBottomNav.tsx` -- fix broken routes

### No new dependencies required
All changes use existing Tailwind classes, Framer Motion, and Shadcn components.

