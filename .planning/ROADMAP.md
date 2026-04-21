# Roadmap

This project follows a phased implementation approach.

## 🚀 Milestone v2.0 (Productivity & Scale)

### [x] Phase 08: Real-time Foundation (Upstash)
**Goal:** Establish the serverless real-time infrastructure using Upstash Redis.
**Requirements:** REK-01, REK-02

**Success Criteria:**
1. Upstash Redis connection successful in Server Actions/Edge functions.
2. In-app notifications trigger successfully across tabs for the same user.
3. Notification component handles empty and active states with premium micro-interactions.

---

### Phase 09: Tenant Analytics (PLG Layer)
**Goal:** Implement usage transparency for organization admins.
**Requirements:** ANA-01, ANA-02

**Success Criteria:**
1. Dashboard displays real-time progress bars for members and projects.
2. Analytics widgets dynamically fetch data from the tenant-specific schema.
3. System blocks project creation once plan limits are reached, showing a proactive upgrade trigger.

---

### Phase 10: Enterprise Domains (Vercel Platforms)
**Goal:** Enable custom domain mapping for organizations.
**Requirements:** DOM-01, DOM-02, DOM-03

**Success Criteria:**
1. Admins can add/remove custom domains in Organization Settings.
2. Domain ownership verification workflow (DNS TXT) is functional.
3. Vercel Platforms API correctly provisions SSL and routes requests to the corresponding tenant slug.

---

## 🏁 Milestone v1.0 (Foundation) - [Complete]
**Status:** Shipped 2026-04-21
**Archive:** [v1.0 Roadmap](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v1.0-ROADMAP.md)

---
*Last update: 2026-04-21*
