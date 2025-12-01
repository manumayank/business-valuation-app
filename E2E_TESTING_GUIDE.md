# End-to-End Testing Guide - Week 1

## Quick Start

### Terminal 1 - Start Backend
```bash
cd backend
npm start
```
**Expected Output:**
```
✓ Migrations completed
✓ Database initialized
🚀 Server running on http://localhost:5000
```

### Terminal 2 - Start Frontend
```bash
cd frontend
npm start
```
**Expected Output:**
Browser opens to http://localhost:3000/login

---

## Test Scenario 1: User Registration

### Steps
1. **View Login Page**
   - URL: `http://localhost:3000/login`
   - Should see "Create one" link for registration
   - ✓ Check: Link navigates to register page

2. **Navigate to Registration**
   - Click "Create one" or go to `http://localhost:3000/register`
   - Should see registration form with fields:
     - Full Name
     - Email
     - Password (with strength indicator)
     - Confirm Password
     - "Create Account" button
   - ✓ Check: All fields visible

3. **Test Password Strength Indicator**
   - Type weak password: `weak`
   - Should show: "Weak" with red indicator
   - ✓ Check: Feedback displays

   - Type medium password: `Medium123`
   - Should show: "Medium" with orange indicator
   - ✓ Check: Feedback updates

   - Type strong password: `SecurePass123!`
   - Should show: "Strong" with green indicator
   - ✓ Check: Feedback updates

4. **Test Form Validation**
   - Leave Name empty, try to submit
   - Should see: "Full Name is required"
   - ✓ Check: Validation error appears

   - Enter invalid email: `notanemail`
   - Should see: Email validation error
   - ✓ Check: Validation triggers

   - Use weak password: `weak`
   - Should see: "Password does not meet requirements"
   - ✓ Check: Password validation works

   - Passwords don't match: `SecurePass123!` vs `SecurePass456!`
   - Should see: "Passwords do not match"
   - ✓ Check: Confirmation validation works

5. **Successful Registration**
   - Use test data:
     - Name: `Test User`
     - Email: `test@example.com`
     - Password: `TestPass123!`
     - Confirm: `TestPass123!`
   - Click "Create Account"
   - Should redirect to login page
   - ✓ Check: Page redirects after 2 seconds
   - ✓ Check: Success message displays

---

## Test Scenario 2: User Login

### Steps
1. **Navigate to Login Page**
   - URL: `http://localhost:3000/login`
   - Should see login form with:
     - Email field
     - Password field
     - "Sign In" button
     - "Create one" link
   - ✓ Check: All elements visible

2. **Test Form Validation**
   - Leave email empty, click "Sign In"
   - Should see: "Email is required"
   - ✓ Check: Validation works

   - Leave password empty, click "Sign In"
   - Should see: "Password is required"
   - ✓ Check: Validation works

3. **Test Invalid Credentials**
   - Email: `test@example.com`
   - Password: `WrongPassword123!`
   - Click "Sign In"
   - Should see: "Invalid credentials"
   - ✓ Check: Error message displays
   - ✓ Check: Page doesn't navigate

4. **Test Valid Credentials**
   - Email: `test@example.com`
   - Password: `TestPass123!`
   - Click "Sign In"
   - Should see: Loading spinner
   - ✓ Check: Spinner appears
   - Should redirect to valuation app
   - ✓ Check: Redirect happens within 2 seconds

5. **Verify Token Storage**
   - Open Browser DevTools (F12)
   - Go to Application → Local Storage
   - Should see:
     - `access_token`
     - `refresh_token`
   - ✓ Check: Tokens are stored

---

## Test Scenario 3: Valuation Wizard

### Steps
1. **View Wizard Initial State**
   - After login, should see:
     - "Step 1 of 5" progress indicator
     - Company information fields:
       - Company Name
       - Industry dropdown
       - Years in Business
       - Number of Employees
     - Next button
   - ✓ Check: Form displays correctly

2. **Fill Step 1: Company Info**
   - Company Name: `Tech Startup Inc`
   - Industry: `Technology / Software`
   - Years: `4`
   - Employees: `25`
   - Click "Next"
   - Should progress to Step 2
   - ✓ Check: Page transitions

3. **Fill Step 2: Financial Metrics**
   - Should see "Step 2 of 5"
   - Annual Revenue: `5000000`
   - EBITDA: `1500000`
   - Profit Margin: `0.25`
   - Click "Next"
   - Should progress to Step 3
   - ✓ Check: Data persists if navigating back

4. **Fill Step 3: Growth & Performance**
   - Should see "Step 3 of 5"
   - Growth Rate: `0.35`
   - Customer Retention: `0.92`
   - Click "Next"
   - Should progress to Step 4
   - ✓ Check: Navigation works

5. **Fill Step 4: Risk Metrics**
   - Should see "Step 4 of 5"
   - Top Customer Concentration: `0.15`
   - Debt Level: `0.25`
   - Click "Next"
   - Should progress to Step 5
   - ✓ Check: Step 5 is review/submit

6. **Review & Submit (Step 5)**
   - Should see "Step 5 of 5" - Review
   - Review all entered data
   - Click "Submit for Valuation"
   - Should see loading spinner with "Calculating valuation..."
   - ✓ Check: Loading state appears

---

## Test Scenario 4: Dashboard & Results

### Steps
1. **View Valuation Results**
   - After submission, should redirect to dashboard
   - Should display:
     - Recommended Valuation (e.g., "$18.0M")
     - Risk Grade (A-F)
     - Risk Score (0-100)
     - Valuation Range (Low - High)
   - ✓ Check: All values display
   - ✓ Check: Values are numeric and reasonable

2. **View Value Drivers Section**
   - Should show cards for positive factors:
     - Strong EBITDA
     - Above-Average Growth
     - Strong Customer Loyalty
     - Low Debt
   - Each card should show:
     - Icon/color
     - Title
     - Description
     - Impact amount ($)
   - ✓ Check: All drivers display with details

3. **View Performance Gaps Section**
   - Should show cards for gaps (if any)
   - Each gap should show:
     - Title
     - Current vs Benchmark values
     - Estimated impact on valuation
   - ✓ Check: Gaps display (or "No gaps" message)

4. **View Improvement Suggestions**
   - Should show actionable suggestions
   - Each suggestion should have:
     - Checkbox (for marking complete)
     - Title
     - Description
     - Priority indicator
     - Estimated impact
   - ✓ Check: All suggestions visible
   - ✓ Check: Can check/uncheck items

---

## Test Scenario 5: Revaluation (Improve Metrics)

### Steps
1. **Mark Improvement as Done**
   - Check the first improvement checkbox
   - Button should appear: "Recalculate Valuation"
   - ✓ Check: Button appears after checking
   - Click "Recalculate Valuation"
   - Should see loading spinner
   - ✓ Check: Loading state shows

2. **View Updated Valuation**
   - After recalculation completes
   - Should see:
     - Updated valuation amount
     - Change indicator (↑ or ↓ with $amount)
     - Percentage change
   - ✓ Check: Values update
   - ✓ Check: Change is displayed
   - Valuation should increase or stay same
   - ✓ Check: Logic is correct

3. **Verify Improvement Marked as Done**
   - Checked improvement should show as "complete"
   - Checkbox should remain checked
   - ✓ Check: Visual feedback for completed items

---

## Test Scenario 6: Protected Routes

### Steps
1. **Verify Authentication Required**
   - Without logging in, try to access `/app`
   - Should redirect to `/login`
   - ✓ Check: Redirect happens

2. **Verify Token Validation**
   - Open DevTools → Application → Local Storage
   - Delete the `access_token`
   - Try to navigate/refresh
   - Should see error or redirect to login
   - ✓ Check: Authentication enforced

3. **Test Token Refresh**
   - Simulate token expiration
   - App should silently refresh token
   - Operations should continue without user action
   - ✓ Check: Seamless refresh happens

---

## Test Scenario 7: UI/UX Testing

### Mobile Responsiveness (Test on phone or device emulation)

1. **iPhone 12 (390×844)**
   - Open app on mobile
   - Forms should stack vertically
   - Buttons should be finger-friendly (≥44px)
   - Text should be readable without zoom
   - ✓ Check: Layout adapts

2. **iPad (768×1024)**
   - Open app on tablet
   - Two-column layout (if applicable)
   - Should feel appropriately spaced
   - ✓ Check: Tablet layout works

3. **Large Desktop (1920×1080)**
   - App should not stretch awkwardly
   - Maximum width constraints apply
   - ✓ Check: Layout is centered/contained

### Accessibility Testing

1. **Keyboard Navigation**
   - Press Tab through all form fields
   - Should focus on inputs, buttons, links in order
   - ✓ Check: Tab order is logical
   - Press Enter on focused button
   - ✓ Check: Button actions trigger

2. **Color Contrast**
   - Text should be readable
   - ✓ Check: No white text on light backgrounds
   - ✓ Check: Form errors visible in red

3. **Error Messages**
   - Should be clear and specific
   - Not just color-coded
   - Include text explanation
   - ✓ Check: All errors have text labels

---

## Test Scenario 8: Performance

### Steps
1. **Login Performance**
   - Time from submit to dashboard
   - Should be < 2 seconds
   - ✓ Check: Fast response

2. **Valuation Calculation**
   - Time from submit to results
   - Should be < 3 seconds
   - ✓ Check: Reasonable latency

3. **Dashboard Load**
   - Page should render immediately
   - Charts should appear within 1 second
   - ✓ Check: No noticeable lag

4. **Form Navigation**
   - Moving between wizard steps
   - Should be instant (< 200ms)
   - ✓ Check: Smooth transitions

---

## Checklist: Final Verification

### Backend API
- [ ] POST /api/auth/register - creates user
- [ ] POST /api/auth/login - returns tokens
- [ ] POST /api/valuate - calculates valuation
- [ ] GET /api/valuations/:id - fetches results
- [ ] Protected routes require valid JWT
- [ ] Error responses are consistent

### Frontend
- [ ] Registration form validates inputs
- [ ] Login form handles errors gracefully
- [ ] Wizard preserves data across steps
- [ ] Dashboard displays valuation correctly
- [ ] Improvements can be marked/unmarked
- [ ] Recalculation updates values
- [ ] Responsive on mobile
- [ ] No console errors (F12)
- [ ] Form loading states show spinners
- [ ] Success messages display appropriately

### Data Integrity
- [ ] New user cannot access other user's data
- [ ] User data persists across sessions
- [ ] Calculations are deterministic
- [ ] Valuation range logic is correct

---

## Issues to Log (if found)

| Issue | Steps to Reproduce | Expected | Actual | Severity |
|-------|-------------------|----------|--------|----------|
| Example: Login button disabled | Fill form and click submit | Button shows spinner | Button doesn't change | Medium |

---

## Success Criteria

✅ All test scenarios pass
✅ No console errors (F12)
✅ Mobile responsive works
✅ Keyboard navigation works
✅ Performance is acceptable
✅ All features functional

**Once all above pass → Week 1 Complete! 🎉**
