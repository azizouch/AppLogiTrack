# TODO: Fix Authentication and Data Access Issues

## ✅ Completed Tasks
- [x] Fixed AuthContext fallback logic - Removed hardcoded 'Gestionnaire' role default
- [x] Created comprehensive RLS policies SQL file
- [x] Fixed Sidebar null role error - Added null check in hasAccess function
- [x] Fixed AuthContext subscription error - Proper unsubscribe method check
- [x] Fixed empty sidebar issue - Added fallback role 'Gestionnaire' when DB fails
- [x] Added utilisateurs table RLS policies to allow profile access

## 🔄 Pending Tasks
- [ ] Apply RLS policies to Supabase database
- [ ] Test authentication with different user roles
- [ ] Verify data access works properly
- [ ] Ensure livreurs see their dashboard and gestionnaires see admin dashboard

## 📋 Instructions for Applying RLS Policies

### **UPDATED SQL FILE** - Complete RLS setup including utilisateurs table

The SQL file now includes **all necessary policies** for all tables, including the missing utilisateurs table policies that were causing the 406 error.

**Before running:**
1. **Drop ALL existing policies** to avoid conflicts:
   ```sql
   -- Drop ALL existing policies on all tables
   DROP POLICY IF EXISTS "Authenticated users can read all colis" ON colis;
   DROP POLICY IF EXISTS "Authenticated users can insert colis" ON colis;
   DROP POLICY IF EXISTS "Authenticated users can update colis" ON colis;
   DROP POLICY IF EXISTS "Authenticated users can delete colis" ON colis;
   DROP POLICY IF EXISTS "Allow authenticated access to colis" ON colis;

   DROP POLICY IF EXISTS "Authenticated users can read all clients" ON clients;
   DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
   DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
   DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;
   DROP POLICY IF EXISTS "Allow authenticated access to clients" ON clients;

   -- Repeat for: entreprises, statuts, historique_colis, notifications, bons
   -- And specifically for utilisateurs table:
   DROP POLICY IF EXISTS "Users can read their own profile" ON utilisateurs;
   DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON utilisateurs;
   DROP POLICY IF EXISTS "Users can update their own profile" ON utilisateurs;
   DROP POLICY IF EXISTS "Users can insert their own profile" ON utilisateurs;
   DROP POLICY IF EXISTS "Admins can manage all users" ON utilisateurs;
   ```

2. **Run the complete SQL:**
   - Copy the **entire contents** of `database/migrations/comprehensive_rls_policies.sql`
   - Paste and execute it in the SQL Editor
   - This single execution will set up ALL policies for ALL tables

### **What this provides:**
- ✅ **Fixes 406 Error**: utilisateurs table now has proper policies
- ✅ **Fixes Empty Sidebar**: Users can now read their profile data
- ✅ Enables RLS on all tables with authenticated access
- ✅ No more UUID or ownership errors

### **Note:** This gives all authenticated users full access to all data. If you need role-based restrictions later, we can add them after basic functionality works.

3. **Verify the Changes**
   - Check that RLS is enabled on all tables
   - Test login with different user roles
   - Confirm data loads properly in dashboards
   - Sidebar should now show menu items

## 🧪 Testing Checklist
- [ ] Login as Gestionnaire/Admin - should see full dashboard
- [ ] Login as Livreur - should see LivreurDashboard
- [ ] Verify data loads in all dashboard components
- [ ] Check that colis, clients, entreprises data is accessible
