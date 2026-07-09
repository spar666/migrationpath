# Admin Data Management - Quick Reference

## What Data Can Admins Insert/Manage?

### 🎯 **Core Management Areas** (15 Admin Components)

#### 1️⃣ **News & Articles** (NewsEditor.tsx)
- **Insert:** News articles, blog posts
- **Fields:** Title, Content, Excerpt, Category, Featured status, Publish date
- **Personas:** Target audience (Students, Skilled, Partners, Employers)

#### 2️⃣ **Occupations** (OccupationMaster.tsx)
- **Insert:** Occupations with ANZSC codes
- **Fields:** Code, Title, Skill Level, Priority status, Points multiplier
- **Special:** Bulk manage occupations and their priorities

#### 3️⃣ **Points Logic** (PointsLogicMaster.tsx)
- **Insert:** Scoring categories and brackets
- **Categories:** Age, English, Education, Work Experience, Australian Experience, Sponsorship
- **For Each:** Define brackets and point values
- **Example:** Age 25-32 = 30 points, Age 40-44 = 15 points

#### 4️⃣ **Points Settings** (OccupationMaster.tsx - Tab 2)
- **Insert:** Global point configurations
- **Settings:**
  - Age brackets (18-24, 25-32, 33-39, 40-44)
  - English levels (Competent, Proficient, Superior)
  - Work experience (3-5yrs, 5-8yrs, 8+yrs)
  - Australian experience (1-3yrs, 3+yrs)

#### 5️⃣ **Website Content** (SiteConfigEditor.tsx)
- **Insert:** Home page, pathway pages content
- **Pages:** Home, Student, Skilled, Partner, Onshore Skilled
- **Fields per page:**
  - Hero headline, subtext, image
  - Call-to-action buttons
  - Benefits list
  - Footer info (MARA statement, links)

#### 6️⃣ **Migration Rules** (MigrationRulesManager.tsx)
- **Insert:** Document requirements, eligibility rules
- **Per Pathway:** Define required documents for each persona type
- **Fields:** Document name, description, mandatory flag

#### 7️⃣ **Visa Invitations** (LiveInvitationsManager.tsx)
- **Insert:** Current invitation rounds
- **Fields:** Date, Visa subclass, Numbers available, Processing time

#### 8️⃣ **Courses** (CourseManager.tsx)
- **Insert:** Study courses and programs
- **Fields:** Name, Institution, Duration, Points value, Qualification type

#### 9️⃣ **User Management** (UserOversight.tsx)
- **Manage:** User accounts, permissions, consultation credits
- **Actions:** View analytics, suspend accounts, award credits

#### 🔟 **Document Reviews** (DocumentReviewPanel.tsx)
- **Manage:** User-submitted documents
- **Actions:** Approve, request corrections, add reviewer notes

#### 1️⃣1️⃣ **Consultations** (ConsultationIntakeTab.tsx)
- **Insert:** Consultation bookings and notes
- **Fields:** Date, Type, Client info, Follow-up notes

#### 1️⃣2️⃣ **Form Logic** (FormLogicEditor.tsx)
- **Insert:** Dynamic form rules
- **Features:** Conditional visibility, branching logic, validation rules

#### 1️⃣3️⃣ **Trends Analysis** (InviteTrendsManager.tsx)
- **View:** Historical invitation and occupation trends
- **Features:** Analytics and reports

#### 1️⃣4️⃣ **Strategy Management** (AdminStrategyPanel.tsx)
- **Manage:** User migration strategies and recommendations
- **Features:** Review and adjust pathway recommendations

#### 1️⃣5️⃣ **Occupation Lists** (OccupationListManager.tsx)
- **Manage:** Bulk occupation data
- **Features:** Import/export, reorder, search

---

## 📊 **Data Insert Summary**

| What | How Many Fields | Component |
|------|-----------------|-----------|
| 📰 News Articles | 8-10 | NewsEditor |
| 💼 Occupations | 5-6 | OccupationMaster |
| 📈 Points Categories | 5 + brackets | PointsLogicMaster |
| ⚙️ Points Settings | 12 values | OccupationMaster |
| 🌐 Site Pages | 6 pages × 5-8 fields | SiteConfigEditor |
| 📋 Document Requirements | 4 fields | MigrationRulesManager |
| 🎓 Courses | 5-7 fields | CourseManager |
| 📅 Visa Invitations | 6-8 fields | LiveInvitationsManager |
| 👥 Users | Permissions, credits | UserOversight |
| 📄 Document Reviews | Comments, status | DocumentReviewPanel |
| 💬 Consultations | 6-8 fields | ConsultationIntakeTab |
| 🔧 Form Rules | Variable | FormLogicEditor |

---

## 🎯 **Most Important Admin Data**

### 🔴 **Critical (Without these, system doesn't work)**
1. **Occupations** - Core to points calculation
2. **Points Logic** - Determines eligibility
3. **Site Config** - Website content display
4. **Visa Invitations** - Current migration status

### 🟠 **High Priority (Enables key features)**
5. **News Articles** - User information
6. **Courses** - Student pathways
7. **Document Requirements** - Visa requirements
8. **User Management** - Platform administration

### 🟡 **Medium Priority (Enhances experience)**
9. **Migration Rules** - Pathway guidance
10. **Consultations** - User engagement
11. **Trends Analysis** - Analytics
12. **Strategy Management** - Personalization

### 🟢 **Low Priority (Nice to have)**
13. **Form Logic** - Dynamic forms
14. **Occupation Lists** - Bulk management
15. **Strategy Panels** - Advanced features

---

## 💾 **Typical Data Insertion Workflow**

```
1. Admin logs in → Admin Dashboard
2. Selects management area (News, Occupations, etc.)
3. Clicks "Add New" or "+" button
4. Fills in form fields
5. Reviews data
6. Clicks "Save" to submit to API
7. Data persists to database
8. Toast notification shows success
9. Data appears in list/table
```

---

## 🔗 **How Data Flows**

```
Admin Component (NewsEditor, OccupationMaster, etc.)
    ↓ (user enters data)
Form/Dialog (input fields)
    ↓ (user clicks save)
useState/setData (local state update)
    ↓ (should be)
API Call (POST/PUT/DELETE to backend)
    ↓ (currently stubbed with TODO comments)
Database (Supabase/PostgreSQL)
    ↓
Frontend Users (view the data in components)
```

---

## 📝 **Notes**

- All admin insertions currently use **local state** (useState)
- **TODO comments** in code show where API calls should be added
- Each component needs to POST/PUT/DELETE to respective API endpoint
- Authentication required before allowing any admin actions
- All changes should be **logged for audit** purposes

---

## 🚀 **Next Steps for Backend Integration**

1. Implement API endpoints for each admin component
2. Add authentication middleware
3. Add audit logging for all data changes
4. Add validation on both frontend and backend
5. Implement pagination for large datasets
6. Add error handling and retry logic
7. Cache frequently accessed data

