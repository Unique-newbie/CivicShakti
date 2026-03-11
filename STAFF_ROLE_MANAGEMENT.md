# CivicShakti — Staff Role Management Guide

In CivicShakti, regular citizens act as normal users who can submit complaints, while **Staff** have elevated privileges to view the `/staff` dashboard, manage complaints, and update statuses.

Since the platform is built on Appwrite, Role-Based Access Control (RBAC) is managed directly through the **Appwrite Console**.

Here is how you upgrade a normal citizen user into a Staff member with a specific jurisdiction (like a Ward Admin or State Admin).

---

## Step 1: Granting the Base "Staff" Role

To allow a user to access the Staff Portal routing (`/staff/...`), they must have the exact label `staff` securely added to their authentication account.

1. Go to your **Appwrite Console**.
2. Click on **Auth** in the left sidebar.
3. Find the user you want to promote and click on their **Name / Email**.
4. Scroll down to the **Labels** string array section.
5. Add the word `staff` to their labels and hit **Update**.

*Note: Once you add this label, the user must log out and log back in to receive their new JWT token containing the staff clearance.*

---

## Step 2: Setting their Admin Level & Jurisdiction

Just because they can access the dashboard doesn't mean they should see every complaint in the country. You must restrict what they see using the `profiles` collection database.

1. Go to **Databases** > **Civic DB** > **Profiles** collection.
2. Find the document that matches the user's `user_id` (you can grab their User ID from the Auth page in Step 1).
3. Update the following fields to give them a specific level of power:

### For a Ward Administrator (Lowest level)
- Set `admin_level` to `"ward"`
- Set `ward_id` to the ID of the specific ward they manage (from the `wards` collection).
- *Result: They only see complaints within their assigned ward.*

### For a Village/Town Administrator
- Set `admin_level` to `"village"`
- Set `village_id` to the ID of their assigned village.
- *Result: They see aggregated stats and complaints from all wards within their village.*

### For a City/District Administrator
- Set `admin_level` to `"city"`
- Set `city_id` to the ID of their assigned city.
- *Result: They see aggregated stats from all villages/towns within their city.*

### For a State Administrator
- Set `admin_level` to `"state"`
- Set `state_id` to the ID of their assigned state.
- *Result: They see state-wide statistics and can monitor all cities within the state.*

### For a Super Administrator (Highest level)
- Set `admin_level` to `"superadmin"`
- Leave the location IDs blank.
- *Result: They have global visibility over the entire platform's complaints and analytics.*
