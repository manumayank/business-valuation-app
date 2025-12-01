# Complete Testing Walkthrough - Step by Step

**Time Required**: 15-20 minutes
**Difficulty**: Easy
**Prerequisites**: Both terminals ready

---

## 🎯 Testing Checklist

- [ ] Backend starts with migrations
- [ ] Frontend loads without errors
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Protected routes work
- [ ] Tokens persist in localStorage
- [ ] Can logout
- [ ] Complete flow works

---

## ✅ STEP 1: Start Backend Server

### Open Terminal 1
Navigate to backend directory:
```bash
cd backend
```

### Install Dependencies (First time only)
```bash
npm install
```

**Expected**: Package installation completes with no errors

### Start Server
```bash
npm start
```

**Expected Output** (watch for these messages):
```
✓ Database initialized
✓ Running migration: 001_expand_users_table
✓ Migration completed: 001_expand_users_table
✓ Running migration: 002_create_organizations_table
✓ Migration completed: 002_create_organizations_table
✓ Running migration: 003_create_organization_members_table
✓ Migration completed: 003_create_organization_members_table
✓ Running migration: 004_expand_valuations_table
✓ Migration completed: 004_expand_valuations_table
✓ Running migration: 005_create_audit_logs_and_preferences
✓ Migration completed: 005_create_audit_logs_and_preferences
✓ Migrations completed

🚀 Server running on http://localhost:5000
```

**✅ Success** if you see all migrations completed and server running message!

### Verify API is Responding
Open new terminal and run:
```bash
curl http://localhost:5000/api/health
```

**Expected**:
```json
{"status":"ok","timestamp":"2025-11-17T..."}
```

---

## ✅ STEP 2: Start Frontend Server

### Open Terminal 2 (while keeping Terminal 1 running)
```bash
cd frontend
```

### Install Dependencies (First time only)
```bash
npm install
```

**Expected**: Installation completes with no errors

### Start React App
```bash
npm start
```

**Expected Output**:
```
Compiled successfully!

You can now view valuation-app-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1...

Note that the development build is not optimized.
To create a production build, use npm run build.
```

**✅ Success** if browser opens automatically to http://localhost:3000 showing **Login page**!

---

## ✅ STEP 3: Verify Login Page Loads

### In Browser (http://localhost:3000)
You should see:
- ✅ "Welcome Back" heading
- ✅ "Sign in to your account" subtitle
- ✅ Email input field
- ✅ Password input field
- ✅ "Sign In" button
- ✅ "Remember me" checkbox
- ✅ "Forgot password?" link
- ✅ "Create one" link for registration

**✅ Success** if login page displays correctly!

---

## ✅ STEP 4: Test User Registration

### Step 4a: Go to Register Page
- Click **"Create one"** link on login page
- OR manually go to: http://localhost:3000/register

**Expected**: Register page displays with:
- ✅ "Create Your Account" heading
- ✅ Full Name input
- ✅ Email input
- ✅ Company input (optional)
- ✅ Password input
- ✅ Confirm Password input
- ✅ Terms & conditions checkbox
- ✅ "Create Account" button

### Step 4b: Fill Registration Form
Enter these values:
```
Full Name:  Test User
Email:      test@example.com
Company:    Acme Corp
Password:   TestPass123!
Confirm:    TestPass123!
```

**Watch for**: As you type the password:
- ✅ Password strength bar appears
- ✅ Changes color as you type
- ✅ Shows "Strong" (green) for TestPass123!

### Step 4c: Accept Terms and Submit
- ✅ Check "I agree to Terms and Conditions"
- ✅ Click **"Create Account"** button
- ✅ Watch for loading spinner

**Expected**:
- Button shows spinner
- Button text changes to "Creating account..."
- After 2-3 seconds, redirects to dashboard

**✅ Success** if redirected to dashboard with valuation wizard!

### What Should Be Visible After Registration
- ✅ "Welcome, Test User" in top right
- ✅ "Sign Out" button visible
- ✅ Wizard form displayed
- ✅ No error messages

### Backend Log (Terminal 1)
Should see:
```
POST /api/auth/register 201 - User registered
```

---

## ✅ STEP 5: Verify Database & Local Storage

### Check Local Storage
In browser, press **F12** (Developer Tools):
1. Go to **Application** tab
2. Click **Local Storage** in left sidebar
3. Click **http://localhost:3000**

**Expected**: Should see 3 items:
```
token:        eyJhbGc... (very long string)
refreshToken: eyJhbGc... (very long string)
user:         {"id":"...", "email":"test@example.com", "fullName":"Test User", ...}
```

**✅ Success** if tokens are saved!

### Check Database
In Terminal 1 (backend), press **Ctrl+C** to stop, then:
```bash
sqlite3 valuation.db
```

**In SQLite shell**:
```sql
SELECT id, email, full_name, company FROM users;
```

**Expected output** (one row):
```
uuid|test@example.com|Test User|Acme Corp
```

**Exit SQLite**:
```
.quit
```

**✅ Success** if user is in database!

### Restart Backend
```bash
npm start
```

---

## ✅ STEP 6: Test Logout

### Click Sign Out Button
- Top right of screen, click **"Sign Out"** button
- Watch for redirect

**Expected**:
- ✅ Redirected to login page
- ✅ localStorage cleared (F12 → Application → Local Storage should be empty)
- ✅ No error messages

**✅ Success** if logged out and redirected!

---

## ✅ STEP 7: Test Login

### Go to Login Page
You should already be at http://localhost:3000/login

### Fill Login Form
```
Email:    test@example.com
Password: TestPass123!
```

### Click Sign In
- Watch for spinner
- After 2-3 seconds, should redirect to dashboard

**Expected**:
- ✅ "Welcome, Test User" appears
- ✅ Sign Out button visible
- ✅ Wizard displayed
- ✅ No errors

**✅ Success** if logged in with same account!

### Backend Log (Terminal 1)
Should see:
```
POST /api/auth/login 200 - User logged in
```

---

## ✅ STEP 8: Test Protected Routes

### With User Still Logged In
Open a new browser tab:
```
http://localhost:3000/
```

**Expected**: Should stay on dashboard (no redirect)

### With User Logged Out

In your current tab:
1. Click **Sign Out**
2. Open Developer Tools (F12)
3. Go to Console tab
4. Clear localStorage:
```javascript
localStorage.clear()
```

5. Try to access http://localhost:3000/
6. Press Enter

**Expected**:
- ✅ Should redirect to http://localhost:3000/login
- ✅ Can't access dashboard without login

**✅ Success** if protected routes work!

---

## ✅ STEP 9: Test Validation

### Go to Register Page Again
http://localhost:3000/register

### Test Invalid Email
- Enter email: `notanemail`
- Leave email field
- **Expected**: Red error below field: "Please enter a valid email address"

### Test Weak Password
- Enter password: `weak`
- **Expected**:
  - Password strength shows "Very Weak" (red bar)
  - Can't submit form

### Test Password Mismatch
- Password: `TestPass123!`
- Confirm: `DifferentPass456!`
- **Expected**: Error below confirm field: "Passwords do not match"

### Test Missing Terms
- Fill everything else correctly
- Don't check "I agree to Terms..."
- Click "Create Account"
- **Expected**: Error below checkbox: "You must agree to the terms and conditions"

**✅ Success** if all validations work!

---

## ✅ STEP 10: Test Complete Workflow

### Register New User (If Needed)
If you just tested logout, register another user:
```
Name:  John Doe
Email: john@example.com
Pass:  JohnPass123!
```

### After Registration
You should be on dashboard with wizard

### Try Creating a Valuation
1. Fill in Company Name: "Test Company"
2. Select Industry: "Tech"
3. Enter Revenue: $1,000,000
4. Enter EBITDA: $200,000
5. etc.

**Expected**:
- ✅ Form validates
- ✅ Can proceed through wizard
- ✅ Redirects to dashboard with results
- ✅ Shows valuation amount

**✅ Success** if complete flow works!

---

## 🎯 Final Checklist

### ✅ All Tests Passed If:

- ✅ Backend starts with all 5 migrations
- ✅ Frontend loads to login page
- ✅ Can register new user
- ✅ Tokens saved in localStorage
- ✅ User appears in database
- ✅ Can login with same credentials
- ✅ Can logout successfully
- ✅ Can't access protected routes when logged out
- ✅ Can access protected routes when logged in
- ✅ Validation works (email, password, etc.)
- ✅ Can create valuation and see results
- ✅ No console errors
- ✅ No backend errors

---

## 🐛 Troubleshooting

### Backend Won't Start
**Problem**: `Port 5000 already in use`
```bash
# Kill process using port 5000
# Linux/Mac:
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend Won't Start
**Problem**: `Port 3000 already in use`
```bash
# Kill process using port 3000 (same as above for port 3000)
```

### "Backend server is not running"
**Problem**: Frontend shows error banner
- Make sure Terminal 1 is running `npm start` for backend
- Check http://localhost:5000/api/health in browser

### Migrations Didn't Run
**Problem**: You don't see migration messages
- Make sure `backend/migrations/` folder exists
- Run `npm install` in backend folder
- Delete `valuation.db` and restart backend

### Can't Login with Just-Registered User
**Problem**: Email/password doesn't work
- Check browser console (F12) for errors
- Check backend logs (Terminal 1) for errors
- Try registering a new user again
- Make sure password is exactly: `TestPass123!`

### Tokens Not Showing in LocalStorage
**Problem**: localStorage empty after registration
- Open DevTools (F12)
- Go to **Application** tab
- Click **Local Storage** in left sidebar
- Click the http://localhost:3000 URL
- Scroll right to see more items

### Form Won't Submit
**Problem**: Can't register or login
- Check all validation errors appear
- Make sure password meets requirements (8+ chars, uppercase, number, special)
- Check browser console for error messages
- Verify backend is running

---

## ✅ Success Signs

### Backend Terminal 1
```
✓ Database initialized
✓ Migrations completed
🚀 Server running on http://localhost:5000
```

### Frontend Terminal 2
```
Compiled successfully!
Local: http://localhost:3000
```

### Browser
- Login page visible
- Can register
- Can login
- Can logout
- Can access dashboard when logged in
- Redirected to login when logged out

---

## 🎬 What's Next After Testing?

If everything works:
1. ✅ Authentication is production-ready
2. Next: Enhance valuation engine
3. Add risk scoring
4. Add multiple valuation methods
5. Final polish and deploy

---

## 📞 Quick Reference

### Start Everything
```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm start
```

### Test Credentials
```
Email:    test@example.com
Password: TestPass123!
```

### API Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/health
```

### Browser URLs
```
http://localhost:3000/login        # Login
http://localhost:3000/register     # Register
http://localhost:3000/              # Dashboard (protected)
```

---

## 🎉 Ready?

Everything is set up and ready to test!

**Start with Step 1** and follow through to Step 10.

Let me know when you hit any issues and I'll help debug! 🚀

