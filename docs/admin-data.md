# Admin Data Management - Complete List

This document outlines all data that can be inserted, managed, and edited from the admin side of the MigrationPath application.

---

## 1. **News & Content Management**

### NewsEditor.tsx
Manages blog articles and news content displayed across the platform.

**Data Managed:**
- **News Articles**
  - `id` - Unique identifier
  - `title` - Article headline
  - `content` - Full article body
  - `excerpt` - Short preview text
  - `category` - Article category (Policy Update, State Nomination, etc.)
  - `personaTag` - Target audience (For Students, For Onshore Skilled, For Partners, For Employers, All Pathways)
  - `published` - Publication status (boolean)
  - `publishedDate` - Publication timestamp
  - `slug` - URL-friendly identifier
  - `date` - Article date
  - `readTime` - Estimated reading time (e.g., "5 min read")
  - `featured` - Featured status for homepage display

**Actions:**
- ✏️ Create new articles
- 📝 Edit existing articles
- 🗑️ Delete articles
- 📌 Toggle featured status
- 🔄 Publish/unpublish articles

**API Endpoint:** `GET/POST/PUT/DELETE /api/v1/news`

---

## 2. **Occupation Management**

### OccupationMaster.tsx
Manages the occupation list and priority settings for skilled migration.

**Data Managed:**
- **Occupations**
  - `anzscoCode` - ANZSC occupation code
  - `title` - Occupation name
  - `skillLevel` - Required skill level (1-5)
  - `isHighPriority` - High priority flag
  - `priorityStatus` - Priority classification (fast-track, standard, limited)
  - `pointsMultiplier` - Points multiplier (e.g., 1.2x)

- **Points Settings** (Global Configuration)
  - `age25to32` - Points for age 25-32 (default: 30)
  - `age18to24` - Points for age 18-24 (default: 25)
  - `age33to39` - Points for age 33-39 (default: 25)
  - `age40to44` - Points for age 40-44 (default: 15)
  - `englishSuperior` - Points for superior English (8.0+) (default: 20)
  - `englishProficient` - Points for proficient English (7.0) (default: 10)
  - `englishCompetent` - Points for competent English (6.0) (default: 0)
  - `experience3to5` - Points for 3-5 years experience (default: 5)
  - `experience5to8` - Points for 5-8 years experience (default: 10)
  - `experience8plus` - Points for 8+ years experience (default: 15)
  - `australianExperience1to3` - Points for 1-3 years AU experience (default: 5)
  - `australianExperience3plus` - Points for 3+ years AU experience (default: 10)

**Actions:**
- ➕ Add new occupations
- ✏️ Edit occupation details and priority
- 🗑️ Delete occupations
- 📊 Configure global points settings
- ⚙️ Adjust skill level multipliers

**API Endpoint:** `GET/POST/PUT/DELETE /api/v1/occupations` & `GET/PUT /api/v1/config/points`

---

## 3. **Points Calculation Logic**

### PointsLogicMaster.tsx
Manages the scoring brackets and rules for points calculation across all migration pathways.

**Data Managed:**
- **Points Categories** (Core Criteria)
  - `id` - Category identifier
  - `name` - Category name (Age, English, Education, Experience, etc.)
  - `description` - Detailed description
  - `questionText` - Question shown to users
  - `isCore` - Whether it's a core requirement
  - `brackets[]` - Scoring brackets for this category

- **Points Brackets** (for each category)
  - `id` - Bracket identifier
  - `label` - User-friendly label (e.g., "25-32 years")
  - `value` - Bracket value
  - `points` - Points awarded for this bracket

- **Subclass Weights**
  - `subclass` - Visa subclass code
  - `name` - Visa name
  - `points` - Weight/points for this visa class

**Example Categories:**
- Age Points (18-24: 25 pts, 25-32: 30 pts, 33-39: 25 pts, 40-44: 15 pts, 45+: 0 pts)
- English Proficiency (Competent: 0, Proficient: 10, Superior: 20)
- Education Qualification (Diploma: 10, Bachelor: 15, Masters: 15, PhD: 20)
- Work Experience (1-3: 5, 3-5: 10, 5-8: 15, 8+: 20 pts)
- Australian Experience
- Sponsorship/Nomination factors

**Actions:**
- ➕ Add new scoring categories
- ✏️ Edit bracket values and point allocations
- 🗑️ Remove categories
- 🔄 Reset to defaults
- 📊 Preview points calculations

**API Endpoint:** `GET/POST/PUT/DELETE /api/v1/config/points-logic`

---

## 4. **Site & Page Configuration**

### SiteConfigEditor.tsx
Manages website content, headlines, CTAs, and page-specific messaging.

**Data Managed:**
- **Home Page**
  - `heroHeadline` - Main headline
  - `heroSubtext` - Subheading
  - `heroImage` - Hero image URL
  - `primaryCta` - Primary call-to-action text
  - `secondaryCta` - Secondary call-to-action text
  - `outlookTitle` - "2026 Migration Outlook" section title
  - `outlookDescription` - Outlook description
  - `processingTimeHealthcare` - Healthcare visa processing time
  - `processingTimeTech` - Tech visa processing time
  - `benefits[]` - List of home page benefits

- **Persona Landing Pages** (Student, Skilled, Partner, Onshore)
  - `heroHeadline` - Page-specific headline
  - `heroSubtext` - Page-specific subheading
  - `heroImage` - Hero image
  - `primaryCta` - Primary action
  - `secondaryCta` - Secondary action
  - `benefits[]` - Pathway-specific benefits

- **Footer Configuration**
  - `maraStatement` - MARA registration disclaimer
  - `quickLinks[]` - Navigation links
  - `resourceLinks[]` - Resource links

**Actions:**
- ✏️ Edit all page headlines and subheadings
- 🖼️ Upload hero images
- 🔗 Manage call-to-action buttons
- 📋 Update benefits lists
- ⚖️ Update legal/compliance statements

**API Endpoint:** `GET/PUT /api/v1/config/site`

---

## 5. **Migration Rules & Requirements**

### MigrationRulesManager.tsx
Manages eligibility rules, document requirements, and pathway-specific rules.

**Data Managed:**
- **Document Requirements**
  - `id` - Requirement ID
  - `document_name` - Document name (e.g., "Proof of Age")
  - `description` - Requirement details
  - `persona_type` - Applicable pathway (student, skilled, partner, etc.)
  - `is_mandatory` - Mandatory flag

- **Pathway Rules**
  - Rules for each migration pathway
  - Eligibility criteria
  - Required documents per persona
  - Processing rules and conditions

**Actions:**
- ➕ Add new document requirements
- ✏️ Edit requirements per pathway
- 🗑️ Remove document requirements
- 🎯 Assign requirements to specific personas
- 📋 Manage mandatory vs. optional documents

**API Endpoint:** `GET/POST/PUT/DELETE /api/v1/rules/documents` & `/api/v1/rules/pathways`

---

## 6. **Points Configuration Manager**

### PointsConfigManager.tsx
General points configuration for the system.

**Data Managed:**
- **Points Configurations**
  - Global point settings
  - Threshold values
  - Qualification point multipliers
  - Experience point scaling

**Actions:**
- ⚙️ Configure point thresholds
- 📊 Adjust global multipliers
- 🔄 Create configuration profiles

**API Endpoint:** `GET/POST/PUT /api/v1/config/points-config`

---

## 7. **Occupation List Management**

### OccupationListManager.tsx
Bulk management of occupation listings and priority ordering.

**Data Managed:**
- **Occupation Rows**
  - Occupation codes and titles
  - Priority levels
  - Associated data and metrics

**Actions:**
- 📋 View full occupation list
- ↕️ Reorder occupations by priority
- 🔍 Search and filter occupations
- 📤 Bulk import occupations
- 📊 Export occupation data

**API Endpoint:** `GET /api/v1/occupations` & bulk operations

---

## 8. **Live Invitations Manager**

### LiveInvitationsManager.tsx
Manages current invitation rounds and visa availability.

**Data Managed:**
- **Current Invitation Rounds**
  - Round dates
  - Visa subclass codes
  - Invitation numbers
  - Processing times
  - Available positions

**Actions:**
- 📅 Create new invitation rounds
- ✏️ Update round details
- 🔔 Publish invitations
- 📊 View invitation statistics

**API Endpoint:** `GET/POST/PUT /api/v1/invitations`

---

## 9. **Invite Trends Manager**

### InviteTrendsManager.tsx
Analyzes and manages historical invitation trends and data.

**Data Managed:**
- **Historical Invitation Data**
  - Trends over time
  - Invitation patterns
  - Occupation demand trends
  - Processing time trends

**Actions:**
- 📈 View trend analytics
- 📊 Generate reports
- 🔍 Analyze patterns

**API Endpoint:** `GET /api/v1/analytics/invite-trends`

---

## 10. **Strategy & Planning Tools**

### AdminStrategyPanel.tsx
Manages user strategy recommendations and migration path planning.

**Data Managed:**
- **Strategy Recommendations**
  - User-specific pathways
  - Timeline recommendations
  - Risk assessments
  - Alternative pathways

**Actions:**
- 📋 Review user strategies
- ✏️ Adjust recommendations
- 📊 Provide guidance

---

## 11. **Course Management**

### CourseManager.tsx
Manages educational courses and study pathways.

**Data Managed:**
- **Courses**
  - Course name
  - Institution
  - Duration
  - Points contribution
  - Qualification type
  - Regional availability

**Actions:**
- ➕ Add new courses
- ✏️ Edit course details
- 🗑️ Remove courses
- 📍 Manage regional availability
- 📊 Track course popularity

**API Endpoint:** `GET/POST/PUT/DELETE /api/v1/courses`

---

## 12. **User Oversight & Management**

### UserOversight.tsx
Admin user management and oversight tools.

**Data Managed:**
- **User Accounts**
  - User profiles
  - Account status
  - Permissions
  - Activity logs
  - Consultation credits

**Actions:**
- 👥 View all users
- 🔐 Manage permissions
- 💳 Award consultation credits
- 📊 View user analytics
- 🚫 Suspend/activate accounts

**API Endpoint:** `GET/PUT /api/v1/admin/users`

---

## 13. **Document Review Management**

### DocumentReviewPanel.tsx
Manages user document submissions and reviews.

**Data Managed:**
- **Submitted Documents**
  - Document type
  - Submission date
  - Review status
  - Reviewer notes
  - User ID

**Actions:**
- 📄 Review submitted documents
- ✅ Approve documents
- ❌ Request corrections
- 💬 Add reviewer comments
- 📋 Track review status

**API Endpoint:** `GET/PUT /api/v1/documents/reviews`

---

## 14. **Consultation Management**

### ConsultationIntakeTab.tsx
Manages consultation bookings, intake forms, and consultation data.

**Data Managed:**
- **Consultation Records**
  - Booking details
  - Intake information
  - Consultation type
  - User details
  - Follow-up notes

**Actions:**
- 📅 Schedule consultations
- 📋 Manage intake forms
- 📝 Record consultation notes
- 🔄 Track follow-ups

**API Endpoint:** `GET/POST/PUT /api/v1/consultations`

---

## 15. **Form Logic Configuration**

### FormLogicEditor.tsx
Manages dynamic form logic and questionnaire branching.

**Data Managed:**
- **Form Rules**
  - Conditional logic
  - Field visibility rules
  - Branching logic
  - Validation rules

**Actions:**
- ➕ Create form rules
- ✏️ Edit logic conditions
- 🗑️ Remove rules
- 🧪 Test form logic

**API Endpoint:** `GET/POST/PUT/DELETE /api/v1/forms/logic`

---

## Summary Table

| Component | Data Type | CRUD Operations | Priority |
|-----------|-----------|-----------------|----------|
| NewsEditor | News Articles | C, R, U, D | High |
| OccupationMaster | Occupations + Points Settings | C, R, U, D | High |
| PointsLogicMaster | Points Categories & Brackets | C, R, U, D | High |
| SiteConfigEditor | Site & Page Config | R, U | High |
| MigrationRulesManager | Rules & Requirements | C, R, U, D | Medium |
| LiveInvitationsManager | Invitation Rounds | C, R, U, D | High |
| UserOversight | User Accounts | R, U | Medium |
| DocumentReviewPanel | Document Reviews | R, U | Medium |
| CourseManager | Courses | C, R, U, D | Medium |
| ConsultationIntakeTab | Consultations | C, R, U, D | Medium |
| FormLogicEditor | Form Logic | C, R, U, D | Low |
| InviteTrendsManager | Analytics Data | R | Low |
| AdminStrategyPanel | Strategies | R, U | Low |

---

## API Endpoints Summary

```
POST   /api/v1/news                      # Create article
PUT    /api/v1/news/{id}                 # Update article
DELETE /api/v1/news/{id}                 # Delete article

POST   /api/v1/occupations               # Add occupation
PUT    /api/v1/occupations/{id}          # Update occupation
DELETE /api/v1/occupations/{id}          # Delete occupation
PUT    /api/v1/config/points             # Update points settings

POST   /api/v1/config/points-logic       # Add points category
PUT    /api/v1/config/points-logic/{id}  # Update category
DELETE /api/v1/config/points-logic/{id}  # Delete category

PUT    /api/v1/config/site               # Update site config
GET    /api/v1/config/site               # Get site config

POST   /api/v1/rules/documents           # Add document requirement
PUT    /api/v1/rules/documents/{id}      # Update requirement
DELETE /api/v1/rules/documents/{id}      # Delete requirement

POST   /api/v1/invitations               # Create invitation round
PUT    /api/v1/invitations/{id}          # Update invitation
GET    /api/v1/analytics/invite-trends   # Get trend data

POST   /api/v1/courses                   # Add course
PUT    /api/v1/courses/{id}              # Update course
DELETE /api/v1/courses/{id}              # Delete course

GET    /api/v1/admin/users               # List users
PUT    /api/v1/admin/users/{id}          # Update user

PUT    /api/v1/documents/reviews/{id}    # Review document

POST   /api/v1/consultations             # Create consultation
PUT    /api/v1/consultations/{id}        # Update consultation

POST   /api/v1/forms/logic               # Create form rule
PUT    /api/v1/forms/logic/{id}          # Update rule
DELETE /api/v1/forms/logic/{id}          # Delete rule
```

---

## Notes

- All admin data insertions should be API-driven (currently using local state)
- Each component has TODO comments indicating where API integration is needed
- Authentication and authorization checks required before allowing data modifications
- All changes should be logged for audit purposes
- Consider implementing pagination for large datasets
- Implement caching strategies for frequently accessed data
