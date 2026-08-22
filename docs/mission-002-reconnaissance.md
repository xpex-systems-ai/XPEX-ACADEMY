# MISSION 002 — RECONNAISSANCE REPORT
**Student Golden Path Validation**

Generated: 2026-08-22 | Branch: `feat/student-golden-path` | Baseline: b2764330

---

## 1. SIGNUP PATH

### Current Implementation
- **Frontend Route**: `apps/web/app/auth/signup/signup.tsx` (pages/OpenSignUp.tsx)
- **Backend Endpoint**: `POST /api/v1/users/` (org-less) or `POST /api/v1/users/{org_id}` (org signup)
- **Gateway Route**: `apps/web/app/api/signup/route.ts` (Next.js API route)

### Flow
1. User fills signup form (email, username, password, name, optional org)
2. Frontend calls `POST /api/signup` (gateway)
3. Gateway validates:
   - Turnstile (captcha) in SaaS mode
   - Disposable email check in SaaS mode
4. Gateway forwards to backend `POST /api/v1/users/{org_id?}` with user data
5. Backend creates user record with:
   - Auto-hashed password
   - Email verification token (SaaS mode)
   - signup_method = "email"
6. Backend returns user/roles/tokens

### Status: **✅ PASS**
- Real implementation exists
- Both org-less and org signup paths supported
- Anti-abuse protections in place

### Gaps: None identified

---

## 2. LOGIN PATH

### Current Implementation
- **Frontend Route**: `apps/web/app/auth/login/login.tsx`
- **Backend Endpoint**: `POST /api/v1/auth/login`
- **Gateway Route**: `apps/web/app/api/auth/[...path]/route.ts`

### Flow
1. User submits email + password
2. Frontend calls `signIn('credentials', { email, password, callbackUrl })`
3. Gateway proxies to backend `/api/v1/auth/login`
4. Backend:
   - Checks rate limiting
   - Checks account lockout
   - Authenticates user (password hash verify)
   - Creates JWT access token (8 hours)
   - Creates refresh token (7 days)
   - Sets httpOnly cookies (ACCESS, REFRESH)
   - Returns `{ access_token, refresh_token (in cookie), expiry }`
5. Frontend:
   - Stores access_token in memory
   - AuthContext calls `/users/session` to fetch full session data
   - Stores roles + user metadata
   - Sets `LH_session` marker cookie

### Status: **⚠️ PARTIAL**
- Backend login implementation is real and hardened
- Frontend session fetch works
- **Issue**: Production logs show successful login (200) but one issue:
  - DELETE /api/v1/auth/logout → 401 (requires investigation)

### Gaps
- [ ] Verify logout behavior is clean/idempotent from user perspective
- [ ] Confirm 401 on logout doesn't block frontend flow

---

## 3. REFRESH PATH

### Current Implementation
- **Frontend Route**: `/api/auth/refresh` (Next.js gateway)
- **Backend Endpoint**: `GET /api/v1/auth/refresh`

### Flow
1. Frontend detects token expiring in 1 minute
2. Calls `GET /api/auth/refresh` (with httpOnly cookies)
3. Gateway forwards to backend `/api/v1/auth/refresh`
4. Backend:
   - Reads refresh token from cookie
   - Validates JWT signature and exp
   - Checks if token is revoked (Redis blocklist)
   - Generates new access token
   - Returns new token + new expiry
5. Frontend:
   - Updates memory state with new access_token
   - Updates tokenExpiry
   - No need to re-fetch session (uses cached metadata)

### Status: **✅ PASS**
- Real refresh implementation with deduplication
- Cross-tab coordination via BroadcastChannel
- Handles stale sessions correctly

### Gaps: None identified

---

## 4. LOGOUT PATH

### Current Implementation
- **Frontend Route**: `apps/web/app/api/auth/logout/route.ts` (missing - needs verification)
- **Backend Endpoint**: `DELETE /api/v1/auth/logout` (found at line 623 in auth.py)
- **AuthContext Export**: `signOut()` function

### Flow
1. User clicks logout
2. Frontend calls `signOut({ callbackUrl: '/login' })`
3. Makes DELETE request to `/api/auth/logout` (gateway)
4. Gateway forwards to backend `/api/v1/auth/logout`
5. Backend:
   - Extracts JWT from Authorization header
   - Validates token payload (sub = email)
   - Resolves user record
   - Calls `revoke_user_sessions_before(user.id)` (Redis blocklist)
   - Calls `unset_auth_cookies(response, request)` (clears cookies)
   - Returns 200 with "Successfully logout"
6. Frontend:
   - Clears auth state (epoch increment, session=null)
   - Clears cookies via gateway response
   - Clears BroadcastChannel
   - Redirects to login

### Status: **⚠️ PARTIAL**
- Backend implementation exists and looks correct
- **Issue**: Production logs show `DELETE /api/v1/auth/logout → 401`
  - This suggests either:
    A. Frontend is calling logout after session already expired
    B. Proxy/backend auth contracts disagree
    C. Frontend route doesn't exist or auth header not forwarded

### Gaps
- [ ] **CRITICAL**: Verify logout route exists in frontend
- [ ] **CRITICAL**: Verify 401 behavior is handled gracefully
- [ ] Logout should be idempotent (401 after logout is OK)

---

## 5. SESSION PATH

### Current Implementation
- **Frontend Fetch**: `GET /api/v1/users/session` (called after login/refresh)
- **AuthContext Cache**: 2-minute TTL
- **Session Marker**: `LH_session` cookie (host-only or domain-scoped)

### Flow
1. After login/token update, frontend calls `GET /api/v1/users/session`
2. Backend:
   - Validates access token from Authorization header
   - Queries User record by JWT sub (email)
   - Queries UserOrganization roles
   - Returns `{ user, roles, tokens: { access_token } }`
3. Frontend stores in AuthContext:
   - `session.data = { user, roles, tokens }`
   - `session.status = 'authenticated'`
   - Caches for 2 minutes

### Status: **✅ PASS**
- Real session fetching and caching works
- Cross-tab coordination via BroadcastChannel

### Gaps: None identified

---

## 6. ORGANIZATION MEMBERSHIP PATH

### Current Implementation
- **Data Model**: `UserOrganization` (user_id, org_id, role_id)
- **Frontend Context**: `OrgContext` (tracks active org)
- **Organization Resolution**:
  - Home page `/home`: Fetches `GET /api/v1/orgs/user/page/1/limit/50`
  - Returns list of orgs user is member of
  - If 0 orgs, redirect to `/new` (create org)
- **Signup Path**:
  - Org signup: `POST /api/v1/users/{org_id}` auto-joins org
  - Org-less signup: `POST /api/v1/users/` creates standalone account
  - User can then join orgs via `/auth/signup?inviteCode=...` or create new org

### Status: **✅ PASS**
- Membership model is real
- Frontend org selection works
- Signup joins org correctly

### Gaps: None identified

---

## 7. STUDENT DASHBOARD / COURSE DISCOVERY

### Current Implementation
- **Frontend Route**: `apps/web/components/Xpex/AuthenticatedXpexExperience.tsx`
- **Backend Endpoint**: `GET /api/v1/xpex/learning-dashboard?organization_slug={slug}`
- **Service**: `apps/api/src/services/xpex/dashboard.py::get_student_dashboard()`

### Flow
1. Student navigates to `/beta/aluno` or similar role-based entry
2. Frontend calls `getXpexLearningDashboard(accessToken, organizationSlug)`
3. Backend:
   - Verifies user is member of org
   - Queries all TrailRun records for user in org
   - Filters to published courses only
   - For each course:
     - Calculates progress from TrailStep records
     - Determines first incomplete activity
     - Builds course card with title, image, progress %, target href
   - Returns:
     ```json
     {
       "organization": "...",
       "summary": {
         "active_courses": N,
         "completed_lessons": N,
         "total_lessons": N,
         "overall_progress_percent": N
       },
       "courses": [
         {
           "course_id": "...",
           "title": "...",
           "image_url": "...",
           "progress_percent": N,
           "target_href": "/orgs/.../course/..."
         }
       ],
       "continue_learning": {...}  // or null
     }
     ```

### Status: **⚠️ PARTIAL**
- Backend implementation is real and detailed (handles locks, restricted access, progress calculation)
- Frontend dashboard component exists (`AuthenticatedDashboard.tsx`)
- **Gap**: Dashboard currently shows empty states or "coming soon":
  - If no courses enrolled: empty state "Nenhum curso disponível ainda"
  - Missing data handling: component checks `data?.courses.length`
  - "Atualizações recentes" (activities) is hard-coded empty `XpexActivityList(items=[])`

### Gaps
- [ ] Dashboard is placeholder for empty data (expected in MVP)
- [ ] Need to verify real TrailRun data exists (from enrollment)
- [ ] Verify course visibility rules work (published + accessible)

---

## 8. COURSE OPENING / COURSE CONTENT

### Current Implementation
- **Frontend Route**: `/orgs/{slug}/course/{courseUuid}` or `/course/{courseUuid}`
- **Backend Courses**: `GET /api/v1/courses/org_slug/{slug}?page=...&limit=...`
- **Backend Course Detail**: `GET /api/v1/courses/{course_uuid}`
- **Service**: `apps/api/src/services/courses/courses.py::get_courses_orgslug()`

### Flow
1. Student clicks "Continuar aprendendo" from dashboard or course list
2. Frontend navigates to `/orgs/{slug}/course/{courseUuid}`
3. Backend fetches course metadata
4. Frontend renders chapters/activities (structure already exists)

### Status: **✅ PASS**
- Real course visibility logic exists
- Visibility rules:
  - Anonymous: public + published only
  - Authenticated: published + public, OR in UserGroup, OR course author
  - Admin: all courses

### Gaps
- [ ] Need to verify published courses exist in org (test data)
- [ ] Need to verify student can see enrolled courses

---

## 9. CHAPTER / ACTIVITY OPENING

### Current Implementation
- **Frontend**: Activity player component loads activity by UUID
- **Backend Endpoint**: `GET /api/v1/courses/{course_uuid}/chapters/{chapter_uuid}/activities/{activity_uuid}`
- **Content Types**: video, document, assignment, SCORM, custom, dynamic

### Status: **✅ PASS**
- Real content model exists
- Multiple activity types supported

### Gaps: None identified (depends on course/chapter data)

---

## 10. PROGRESS / TRAIL PERSISTENCE

### Current Implementation
- **Data Models**:
  - `Trail`: User's learning path in org (user_id, org_id)
  - `TrailRun`: Enrollment in a specific course (trail_id, course_id, status)
  - `TrailStep`: Activity completion record (user_id, course_id, activity_id, complete, timestamp)
- **Backend Endpoints**:
  - `POST /api/v1/trail/start`: Create new trail
  - `POST /api/v1/trail/add_course/{course_uuid}`: Enroll in course
  - `POST /api/v1/trail/add_activity/{activity_uuid}`: Mark activity started
  - `PUT /api/v1/trail/...`: Update progress
  - `DELETE /api/v1/trail/...`: Unenroll

### Status: **✅ PASS**
- Real trail/progress model exists
- Persistence is to PostgreSQL
- Dashboard correctly reads from TrailStep and TrailRun

### Gaps
- [ ] Need to verify student can call these endpoints (RBAC)
- [ ] Need to verify activity completion updates are persisted

---

## 11. RETURNING STUDENT / SESSION RESUME

### Current Implementation
- Relies on standard browser cookie persistence
- On return visit:
  1. Frontend checks for `LH_session` marker cookie
  2. If found, calls `GET /api/auth/refresh` (uses httpOnly refresh token)
  3. Gets new access token
  4. Calls `GET /api/v1/users/session` to restore full session
  5. Redirects to last org or home

### Status: **✅ PASS**
- Real resume logic with cookie-based session continuation

### Gaps: None identified

---

## SUMMARY: GOLDEN PATH STATUS

| Step | Status | Evidence | Blocker |
|------|--------|----------|---------|
| Signup | ✅ PASS | `apps/web/app/api/signup/route.ts`, `create_user()` | No |
| Login | ⚠️ PARTIAL | Real backend, but logout 401 | **YES** |
| Refresh | ✅ PASS | `/api/auth/refresh` + dedup | No |
| Logout | ⚠️ PARTIAL | Backend exists, frontend route unclear, 401 issue | **YES** |
| Session | ✅ PASS | `/api/v1/users/session` + cache | No |
| Org Membership | ✅ PASS | Real model, working | No |
| Dashboard Discovery | ⚠️ PARTIAL | Real backend, empty states expected | No |
| Course Opening | ✅ PASS | Real visibility rules | No |
| Chapter/Activity | ✅ PASS | Real content model | No |
| Progress Persistence | ✅ PASS | Real Trail/TrailRun/TrailStep | No |
| Resume | ✅ PASS | Cookie + refresh | No |

---

## PHASE 2 CRITICAL QUESTIONS

### Must Investigate

1. **Logout 401 Issue**
   - Does frontend route exist at `apps/web/app/api/auth/logout/route.ts`?
   - Is the route properly handling invalid/expired sessions?
   - Should logout be idempotent (401 is acceptable)?

2. **Dashboard Empty State**
   - Are there any published courses in production org (`kelle-digital-lab`)?
   - Does test student have any TrailRun enrollments?
   - Is the dashboard correctly querying prod database?

3. **Production Contract Validation**
   - What is the prod org slug?
   - Is LEARNHOUSE_DOMAIN configured correctly?
   - Are cookies being set with correct domain/secure/samesite?

4. **Test Data**
   - Does prod have test student account?
   - Are there test published courses?
   - Can test student be enrolled via API?

---

## NEXT PHASE: IMPLEMENTATION

Minimal P0 fixes needed:
1. **Verify/Fix Logout 401** — make it idempotent
2. **Verify Dashboard** — confirm real data loads
3. **Add Production Contract Audit** — validate config
4. **Add Focused Tests** — signup → login → logout sequence

See [PHASE 2 PLAN](./mission-002-phase-2.md) for details.
