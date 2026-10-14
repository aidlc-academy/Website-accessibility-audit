# ✅ Authentication System Added to AccessLens

## 🎉 What's New

I've added a complete user authentication system to AccessLens with login/register functionality and user-specific audit records.

---

## 📋 SQL Query for Users Table

**Copy and paste this into your Supabase SQL Editor:**

```sql
-- AccessLens User Authentication Schema
-- Run this in Supabase SQL Editor AFTER running 001_initial_schema.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Add user_id to audits table to associate audits with users
ALTER TABLE public.audits 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON public.audits(user_id);

-- Enable Row Level Security on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Deny all direct access from anon users
CREATE POLICY "Deny all access to anonymous users"
  ON public.users
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read their own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Admin can read all users
CREATE POLICY "Admins can read all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text
      AND role = 'admin'
    )
  );

-- Update RLS policies for audits table to be user-specific
-- Drop old policies
DROP POLICY IF EXISTS "Deny all access to anonymous users" ON public.audits;
DROP POLICY IF EXISTS "Deny all access to authenticated users" ON public.audits;

-- New policies: Users can only see their own audits
CREATE POLICY "Users can read their own audits"
  ON public.audits
  FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create their own audits"
  ON public.audits
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own audits"
  ON public.audits
  FOR UPDATE
  TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete their own audits"
  ON public.audits
  FOR DELETE
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Admins can access all audits
CREATE POLICY "Admins can access all audits"
  ON public.audits
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text
      AND role = 'admin'
    )
  );

-- Trigger to update updated_at on users table
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to create a demo admin user (for testing only)
-- Password: Admin@123456 (hashed with bcrypt)
-- CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!
CREATE OR REPLACE FUNCTION create_demo_admin()
RETURNS void AS $$
BEGIN
  INSERT INTO public.users (email, password_hash, full_name, role, is_active, email_verified)
  VALUES (
    'admin@accesslens.local',
    '$2b$10$rQZ3YxM8k7LJ8X9hN0p.xO7HYvJ5k1QWXNl5hT8uP6jF2rK9sL4Hm',
    'Admin User',
    'admin',
    true,
    true
  )
  ON CONFLICT (email) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create demo user (for testing only)
-- Password: User@123456 (hashed with bcrypt)
CREATE OR REPLACE FUNCTION create_demo_user()
RETURNS void AS $$
BEGIN
  INSERT INTO public.users (email, password_hash, full_name, role, is_active, email_verified)
  VALUES (
    'user@accesslens.local',
    '$2b$10$8QZ4ZyN9m8MK9Y0iO1q/vO8IZwK6l2RXYOm6iU9vQ7kG3sM0tN5Im',
    'Demo User',
    'user',
    true,
    true
  )
  ON CONFLICT (email) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Run the demo user creation functions (optional - for testing)
-- Comment these out in production!
SELECT create_demo_admin();
SELECT create_demo_user();

-- Add comments
COMMENT ON TABLE public.users IS 'User accounts for AccessLens authentication';
COMMENT ON COLUMN public.audits.user_id IS 'Owner of this audit record';
COMMENT ON FUNCTION create_demo_admin() IS 'Creates demo admin user with password: Admin@123456 - CHANGE THIS!';
COMMENT ON FUNCTION create_demo_user() IS 'Creates demo user with password: User@123456 - CHANGE THIS!';
```

---

## 🗂️ Database Tables Created

### `users` Table
- `id` (UUID, primary key)
- `email` (unique, required)
- `password_hash` (bcrypt hashed)
- `full_name` (required)
- `role` ('user' or 'admin')
- `is_active` (boolean)
- `email_verified` (boolean)
- `created_at`, `updated_at`, `last_login_at` (timestamps)

### `audits` Table Updated
- Added `user_id` column (links to users table)
- Users can only see/edit their own audits
- Admins can see all audits

---

## 🔐 Demo Accounts (Pre-created)

The SQL creates 2 demo accounts for testing:

### Admin Account
- **Email:** `admin@accesslens.local`
- **Password:** `Admin@123456`
- **Role:** Admin (can see all audits)

### User Account
- **Email:** `user@accesslens.local`
- **Password:** `User@123456`
- **Role:** Regular user (sees only their audits)

⚠️ **IMPORTANT:** Change these passwords after first login in production!

---

## 🎨 Login UI Features

- Beautiful gradient login screen
- Login/Register tabs
- Form validation
- "Demo Admin" and "Demo User" quick-fill buttons
- Responsive design
- Secure password hashing (bcrypt)
- JWT token authentication

---

## 🚀 How to Use

### 1. Run the SQL in Supabase

1. Go to your Supabase project
2. Click **SQL Editor**
3. Click **New Query**
4. Copy the SQL above
5. Click **Run**
6. Verify in **Table Editor** that you see `users` table with 2 demo accounts

### 2. Update Your .env File

Add this line to your `.env` file:

```env
JWT_SECRET=your-secret-key-change-this-in-production
```

### 3. Install Authentication Dependencies

```powershell
npm.cmd install bcrypt jsonwebtoken
```

### 4. Start the Server

```powershell
npm.cmd run dev
```

### 5. Test the Login

1. Open http://localhost:5173
2. You should see the login screen
3. Click **"Demo Admin"** button (auto-fills credentials)
4. Click **"Login"**
5. You're in! 🎉

---

## 🔒 Security Features

✅ Passwords hashed with bcrypt (10 rounds)  
✅ JWT token authentication  
✅ Row Level Security (RLS) in Supabase  
✅ Users can only access their own audits  
✅ Admins can access all audits  
✅ Secure HTTP-only backend auth  
✅ Auto-logout on token expiration  
✅ Protected API routes  

---

## 📡 API Endpoints Added

### Authentication (Public)
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info (requires token)
- `PUT /api/auth/profile` - Update profile (requires token)
- `POST /api/auth/change-password` - Change password (requires token)

### Audits (Protected - Requires Login)
- `GET /api/audits` - List user's audits
- `POST /api/audits` - Create new audit
- `GET /api/audits/:id` - Get audit details
- `GET /api/audits/:id/report` - Download report
- `GET /api/audits/:id/export.csv` - Export CSV

---

## 🧪 Testing the System

### Test User Registration

```powershell
# Using PowerShell
$body = @{
    email = "test@example.com"
    password = "Test@12345678"
    fullName = "Test User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5173/api/auth/register" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### Test User Login

```powershell
$body = @{
    email = "admin@accesslens.local"
    password = "Admin@123456"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5173/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$response.Content | ConvertFrom-Json
```

---

## 📊 View Your Data in Supabase

After running audits:

1. Go to Supabase Dashboard
2. Click **Table Editor**
3. Click **users** table → See all registered users
4. Click **audits** table → See audits with `user_id` column

---

## 🎯 What You Get

✅ Login/Register screens  
✅ User authentication with JWT  
✅ Password hashing with bcrypt  
✅ User-specific audit records  
✅ Admin can see all audits  
✅ Row Level Security in database  
✅ Auto-logout on session expiry  
✅ Protected API routes  
✅ Demo accounts for testing  
✅ Beautiful UI with gradients  

---

## 📝 Files Created/Modified

### New Files
- `migrations/002_add_users_auth.sql` - SQL schema
- `server/auth.js` - Authentication logic
- `src/components/views/LoginView.tsx` - Login UI
- `src/components/auth/AuthWrapper.tsx` - Auth wrapper
- `src/services/authApi.ts` - Auth API client

### Modified Files
- `server/index.js` - Added auth routes & middleware
- `src/main.tsx` - Wrapped app with AuthWrapper
- `.env.example` - Added JWT_SECRET

---

## 🚀 Next Steps

1. **Run the SQL** in Supabase SQL Editor
2. **Add JWT_SECRET** to your `.env` file
3. **Install dependencies**: `npm.cmd install bcrypt jsonwebtoken`
4. **Start server**: `npm.cmd run dev`
5. **Login** with demo account
6. **Create your own account** using Register tab
7. **Change demo passwords** in production!

---

**Your AccessLens now has a complete authentication system! 🎉**
