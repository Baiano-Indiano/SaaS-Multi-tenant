# Phase 17: Member Management - PLAN

## Overview
Transform the existing raw Member Management components into a visually premium, enterprise-grade interface. This entails integrating shadcn/ui components for data presentation (Tables) and interactions (Modals, Dropdowns), alongside smooth staggered animations via Framer Motion. 

## Requirements
1. **Fix Uncontrolled Input Warning:** Resolve the React warning `A component is changing the default value state of an uncontrolled Select after being initialized` in the `AuthForm.tsx` or related Member/Invite forms.
2. **MemberList & InvitationsTable:** Migrate tables to use shadcn/ui `Table`, `TableHeader`, `TableRow`, `TableCell` components. Wrap rows in Framer Motion variants to ensure a "Staggered Entry" cascade effect on load.
3. **InviteMemberDialog:** Update modal interactions. Confirm it triggers only a toast.success on successful invitation, immediately closing or redirecting as needed, without excessive success screens.
4. **MemberActions:** Ensure role selection and destructive actions (removal) have correct visual states (e.g. loading spinners, destructive button styles).

## Implementation Steps

### Step 1: Fix Uncontrolled Select Warning
- Target file: Examine `AuthForm.tsx` (as per user warning report) or `InviteMemberDialog.tsx` where Select components are used.
- Action: Ensure that the `value` prop is always defined (e.g., `value={formState.role || ""}`) instead of switching between undefined and a string.

### Step 2: Integrate Staggered Entry using Framer Motion
- Target file: `src/components/members/MemberList.tsx` and `src/components/members/InvitationsTable.tsx`.
- Action: Wrap the `tbody` mapping in a `motion.tbody` or similar container with `variants` for `hidden` and `show`, using `staggerChildren`. Apply an `opacity` and `y` translation variant to each `motion.tr`.

### Step 3: Upgrade Tables with shadcn/ui
- Target files: `MemberList.tsx` and `InvitationsTable.tsx`.
- Action: Import and implement the `Table` components from `@/components/ui/table`. Replace standard `<table>`, `<th>`, `<td>` with `Table`, `TableHead`, `TableCell`.

### Step 4: Refine Invite Modal
- Target file: `src/components/members/InviteMemberDialog.tsx`.
- Action: Ensure the form submits via the Server Action and only fires `toast.success` followed by a dialog close/refresh. Remove any complex multi-step success states if present.

## Testing & Verification
1. Open the members page and verify staggered animations trigger correctly.
2. Ensure the console is free of the "uncontrolled Select" React warning.
3. Successfully invite a member and confirm the minimalist toast + immediate dialog close behavior.
