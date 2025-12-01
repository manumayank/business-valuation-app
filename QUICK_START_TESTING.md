# Quick Start - Testing Full Authentication System

**Time to Test**: 5 minutes
**Prerequisites**: Node.js 16+, npm

---

## 🚀 Start Backend (Terminal 1)

```bash
cd backend
npm install
npm start
```

**Expected Output:**
```
✓ Database initialized
✓ Migrations completed
🚀 Server running on http://localhost:5000
```

✅ **Migrations automatically ran!** The database now has:
- Expanded users table with auth fields
- Organizations table
- Organization members table
- Audit logs table
- And more...

---

## 🎨 Start Frontend (Terminal 2)

```bash
cd frontend
npm install  # Only if first time
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view valuation-app-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168...
```

✅ **Browser should open automatically to http://localhost:3000**
- You'll see the Login page
- Backend connection is working!

---

## 📋 Test Scenario 1: Registration

### Step 1: Go to Register Page
- Click "Create one" link
- Or go to http://localhost:3000/register

### Step 2: Fill Out Form
```
Full Name:  John Doe
Email:      john@example.com
Company:    Acme Corp
Password:   SecurePass123!
```

### Step 3: Verify Password Strength
- Watch the password strength bar change colors
- Should be at "Strong" (green) for `SecurePass123!`

### Step 4: Confirm & Accept Terms
- Check "I agree to Terms..."
- Click "Create Account"

### Expected Result ✅
- Form submits to backend
- Backend creates user + organization
- JWT tokens returned and saved
- Redirected to dashboard
- Wizard component displays
- User name shown in header: "Welcome, John Doe"

---

## 📋 Test Scenario 2: Login

### Step 1: Logout (if logged in)
- Click "Sign Out" button in header
- Redirected to login page

### Step 2: Fill Login Form
```
Email:      john@example.com
Password:   SecurePass123!
```

### Step 3: Click Sign In
- Form submits
- Loading spinner appears
- Should redirect to dashboard

### Expected Result ✅
- Welcome message shows your name
- Wizard is ready to use
- You're logged in!

---

## 📋 Test Scenario 3: Token Refresh

### Step 1: Open Browser Developer Tools
- Press F12 or Cmd+Option+I

### Step 2: Check Local Storage
- Go to Application/Storage tab
- Look for localStorage
- You should see:
  - `token` - Access token
  - `refreshToken` - Refresh token
  - `user` - User object

### Step 3: Navigate Around
- The access token is automatically added to all requests
- If token expires, refresh token automatically gets new one
- You can stay logged in indefinitely (until refresh token expires)

### Expected Result ✅
- Tokens persist in localStorage
- No extra login needed
- Automatic token refresh works

---

## 📋 Test Scenario 4: Protected Routes

### Step 1: Logout
- Click "Sign Out"
- Tokens cleared from localStorage

### Step 2: Try to Access Dashboard
- Go to http://localhost:3000/ or /dashboard
- You should be redirected to /login

### Expected Result ✅
- Route is protected!
- Can't access dashboard without login

---

## 📋 Test Scenario 5: Validation Errors

### Step 1: Go to Register Page

### Step 2: Test Invalid Email
- Type: `notanemail`
- Leave field
- Error appears: "Please enter a valid email address"

### Step 3: Test Weak Password
- Type: `weak`
- Password strength shows "Very Weak" (red)
- Can't submit (fails password requirements)

### Step 4: Test Password Mismatch
- Password: `SecurePass123!`
- Confirm:  `SecurePass456!`
- Error: "Passwords do not match"

### Expected Result ✅
- Validation works on both frontend and backend
- Clear error messages
- Can't submit invalid form

---

## 🔍 Check Backend Logs

### Terminal 1 (Backend)
You should see:
```
Running migration: 001_expand_users_table
✓ Migration completed: 001_expand_users_table
Running migration: 002_create_organizations_table
✓ Migration completed: 002_create_organizations_table
...
All migrations completed
```

When you register, you'll see:
```
POST /api/auth/register 201 - User registered
```

When you login, you'll see:
```
POST /api/auth/login 200 - User logged in
```

---

## 🐛 Troubleshooting

### "Backend server is not running"
✅ **Solution**: Make sure you started backend first
```bash
cd backend
npm start
```

### "Cannot find token" error
✅ **Solution**: Clear browser storage and refresh
```javascript
// In browser console:
localStorage.clear()
// Refresh page
```

### Port 3000 already in use
✅ **Solution**: Kill process or use different port
```bash
# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Port 5000 already in use
✅ **Solution**: Same as above for port 5000

### "Module not found" error
✅ **Solution**: Install dependencies
```bash
npm install
```

---

## ✅ Success Checklist

After testing all scenarios, you should have:

- ✅ Backend running with migrations
- ✅ Frontend loading without errors
- ✅ Able to register new user
- ✅ Able to login with credentials
- ✅ Protected routes enforce authentication
- ✅ Tokens saved in localStorage
- ✅ Validation works on both sides
- ✅ Error messages are clear
- ✅ User info displays in header
- ✅ Logout clears everything
- ✅ Can see dashboard/wizard after login

---

## 📊 Database Check

### View SQLite Database
```bash
# From backend directory
sqlite3 valuation.db

# In sqlite shell:
.tables
# Should show:
# users  organizations  organization_members  valuations
# completed_improvements  audit_logs  user_preferences  migrations

# Check users table:
SELECT id, email, full_name, company FROM users;

# Exit sqlite:
.quit
```

---

## 🎬 Next Steps

Once all tests pass:

1. **Backend**: Enhance valuation engine (risk scoring, multiple methods)
2. **Integration**: Test full flow (register → valuation → dashboard)
3. **Polish**: Fix any issues, optimize performance
4. **Demo**: Ready to show stakeholders!

---

## 🚀 Ready?

All components are working!

**Next**: Enhance the valuation engine to add:
- Risk scoring system
- Multiple valuation methods
- Better industry benchmarks

See you there! 💪

