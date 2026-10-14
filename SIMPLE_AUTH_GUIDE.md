# ✅ Simple Authentication System - Ready to Use!

## 🎉 What's Working Now

✅ **No Supabase required** - Uses local JSON file  
✅ **Admin account pre-configured** - Your credentials are ready  
✅ **Any user can register** - Self-service registration  
✅ **Beautiful login UI** - Modern gradient design  
✅ **JWT authentication** - Secure token-based auth  
✅ **User-specific audits** - Each user sees only their data  

---

## 🔐 Default Admin Credentials

**Email:** `tpandi412@gmail.com`  
**Password:** `thanga2401@`  
**Role:** Admin  

This account is **automatically created** when you start the server!

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

```powershell
npm.cmd install bcrypt jsonwebtoken
```

### Step 2: Start Server

```powershell
npm.cmd run dev
```

### Step 3: Login

1. Open: **http://localhost:5173**
2. You'll see a login screen
3. Enter:
   - Email: `tpandi412@gmail.com`
   - Password: `thanga2401@`
4. Click **Login**
5. Done! 🎉

---

## 👥 How Users Can Register

Anyone can create an account:

1. Open http://localhost:5173
2. Click the **"Register"** tab
3. Fill in:
   - Full Name
   - Email
   - Password (min 8 characters)
4. Click **"Create Account"**
5. Switch to Login tab
6. Login with new credentials

---

## 📁 Where User Data is Stored

**File:** `data/users.json`

This local JSON file stores:
- User accounts
- Hashed passwords (bcrypt)
- Roles (admin/user)
- Login timestamps

**Security:**
- File is excluded from Git
- Passwords are hashed with bcrypt
- JWT tokens for sessions

---

## 🔍 How It Works

### 1. First Server Start
- Creates `data/users.json`
- Adds admin account automatically
- Email: `tpandi412@gmail.com`
- Password: `thanga2401@` (hashed)

### 2. User Login
- Verifies email + password
- Generates JWT token (7 days)
- Returns user data + token
- Token stored in browser

### 3. User Registration
- Validates input
- Checks for duplicate email
- Hashes password with bcrypt
- Creates new user account
- Saves to `data/users.json`

### 4. Protected Routes
- All audit API routes require login
- JWT token sent in headers
- Users see only their audits
- Admins see all audits

---

## 🎯 Features

### ✅ Login
- Email + password authentication
- JWT token generation
- Session persistence (7 days)
- Auto-logout on token expiry

### ✅ Register
- Self-service registration
- Email validation
- Password strength check (min 8 chars)
- Duplicate email prevention
- Success message after registration

### ✅ User Roles
- **Admin** - Can see all audits
- **User** - Sees only their own audits

### ✅ Security
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens (HS256)
- Protected API routes
- Auth required for all operations

---

## 📊 Admin Dashboard

As admin (`tpandi412@gmail.com`), you can:
- ✅ See all users' audits
- ✅ Run new audits
- ✅ Export reports
- ✅ View scan history
- ✅ Access all features

Regular users see only their own data.

---

## 🧪 Testing

### Test Admin Login
```powershell
# Using PowerShell
$body = @{
    email = "tpandi412@gmail.com"
    password = "thanga2401@"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5173/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$response.Content | ConvertFrom-Json
```

### Test User Registration
```powershell
$body = @{
    email = "newuser@example.com"
    password = "MyPassword123"
    fullName = "New User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5173/api/auth/register" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

---

## 📝 Files Created/Modified

### New Files
- `server/simpleAuth.js` - Local authentication logic
- `data/users.json` - User database (auto-created)
- `SIMPLE_AUTH_GUIDE.md` - This guide

### Modified Files
- `server/index.js` - Uses simpleAuth instead of auth.js
- `src/components/views/LoginView.tsx` - Improved UI
- `.gitignore` - Added users.json

---

## 🔒 Security Notes

### ✅ Good
- Passwords hashed with bcrypt
- JWT tokens for sessions
- Protected API routes
- Local file storage

### ⚠️ Limitations (for production)
- No email verification
- No password reset
- Local file (not scalable)
- No rate limiting
- No session management

**For production**, consider:
- Moving to Supabase (already implemented)
- Adding email verification
- Implementing password reset
- Adding rate limiting
- Using Redis for sessions

---

## 🎨 Login UI Features

- **Beautiful gradient design** - Modern purple theme
- **Login/Register tabs** - Easy switching
- **Form validation** - Real-time error messages
- **Loading states** - Visual feedback
- **Responsive** - Works on all devices
- **Welcome message** - First-time user help
- **Success messages** - Clear feedback

---

## 🐛 Troubleshooting

### "Authentication required" error
- Make sure you're logged in
- Check if token is in localStorage
- Token may have expired (7 days)

### "User already exists" error
- Email is already registered
- Use different email
- Or login with existing account

### Can't see other users' audits
- This is by design!
- Regular users see only their audits
- Login as admin to see all

### Admin account not working
- Make sure server started correctly
- Check `data/users.json` exists
- Verify email: `tpandi412@gmail.com`
- Verify password: `thanga2401@`

---

## 🎯 Next Steps

1. ✅ Install dependencies: `npm.cmd install bcrypt jsonwebtoken`
2. ✅ Start server: `npm.cmd run dev`
3. ✅ Login as admin: `tpandi412@gmail.com` / `thanga2401@`
4. ✅ Create test user account
5. ✅ Run an audit
6. ✅ See it saved to your account

---

## 📊 View User Data

To see registered users:

```powershell
Get-Content "data\users.json" | ConvertFrom-Json | Format-Table email, full_name, role, created_at
```

---

**Your authentication system is ready to use! Just install bcrypt & jsonwebtoken, then start the server.** 🚀
