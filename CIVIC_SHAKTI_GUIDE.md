# CivicShakti - Comprehensive Application Guide

Welcome to **CivicShakti**, a modern, responsive, and hierarchical civic issue reporting and management platform. This guide explains everything about the app, its features, user roles, how the system works, and how to navigate it from both a Citizen and Staff perspective.

---

## Table of Contents
1. [Overview & Core Concept](#1-overview--core-concept)
2. [Citizen Portal (Public Facing)](#2-citizen-portal-public-facing)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [How to Become Staff](#4-how-to-become-staff)
5. [Staff Portal Features](#5-staff-portal-features)
6. [Hierarchical Delegation System](#6-hierarchical-delegation-system)
7. [Technical Stack & Integrations](#7-technical-stack--integrations)

---

## 1. Overview & Core Concept
**CivicShakti** bridges the gap between citizens reporting local issues (potholes, water supply, electricity, sanitation) and the government/civil staff responsible for fixing them. 

The app features a **hierarchical geographic system**:
- **State** -> **City/District** -> **Village/Gram Panchayat** -> **Ward**
- Staff members are assigned to specific geographical nodes. They only see and manage complaints within their jurisdiction.

---

## 2. Citizen Portal (Public Facing)
When a regular user (Citizen) visits the app, they have access to the public-facing features.

### Features for Citizens:
- **Authentication**: Sign up and login using email/password (powered by Appwrite).
- **Profile & Verification**: Users must complete their profile. Accounts can be officially *Verified* to attach credibility to their reports.
- **Report an Issue (Submit Complaint)**:
  - Select Category (e.g., Infrastructure, Sanitation, Water) and Sub-category.
  - Set Urgency (Low, Medium, High).
  - Provide Location strings: State, City, Village, Ward.
  - Upload Media (Images/Videos of the issue).
- **Track Complaints**: View a personal dashboard of submitted complaints, see their current status (Pending, In Progress, Resolved, Escalated), and read official resolution remarks from staff.
- **Public Feed / Map**: View public complaints submitted by others in their area to avoid duplicate reporting.

### How to Access:
- Simply visit the app's homepage (`/`). 
- Features requiring a logged-in state (like submitting a complaint) will redirect users to the login (`/login`) or signup (`/signup`) pages.

---

## 3. User Roles & Permissions
The system relies on labels attached to user accounts to determine their access level.

| Role | Access Level | Responsibilities |
|------|--------------|------------------|
| **Citizen** | Public | Report issues, track personal complaints, view public data. |
| **Ward Manager** | Staff | Manage, update, and resolve complaints specifically within their assigned Ward. |
| **Village Manager** | Staff | Manage complaints within their Village/Gram Panchayat. Can delegate roles to Ward Managers within their village. |
| **City Manager** | Staff | Manage complaints for the entire City. Oversees city-level issues and can delegate roles to Village and Ward Managers within their city. |
| **State Manager** | Staff | Oversees complaints and staff across an entire State. Can delegate roles to City, Village, and Ward Managers within their state. |
| **Superadmin** | Global Admin | Unrestricted access. Views all complaints globally, manages all user accounts, accesses global app stats, and views system error logs. |

---

## 4. How to Become Staff
Regular citizens cannot become staff on their own. **You must be appointed by a higher-ranking official or a Superadmin.**

### The Process:
1. A citizen creates a standard account on CivicShakti.
2. An existing Staff Member (with sufficient rank) logs into the **Staff Portal**.
3. The Staff Member goes to the **Users** management page.
4. They search for the citizen's account and click **Manage Role**.
5. The Staff Member assigns a rank (e.g., City Manager assigns a user as a Ward Manager).
6. The Staff Member specifies the geographical jurisdiction (e.g., "Ward 14").
7. *Instantly*, the citizen's account is upgraded. When they log in, they will now have access to the Staff Portal (`/staff`).

*Note: Initial `superadmin` accounts are usually created manually by the database administrator directly in the Appwrite backend console by adding the `superadmin` label to a specific user's account.*

---

## 5. Staff Portal Features
The Staff Portal (`/staff`) is the backend management interface for officials. Access is strictly blocked for regular citizens. What a staff member sees depends entirely on their Role and Jurisdiction.

### 🏠 Dashboard (`/staff/dashboard`)
- **Quick Stats**: Total complaints, pending, resolved, etc., *filtered to their jurisdiction*.
- **Charts**: Visual breakdown of complaints by category and status.
- **Recent Activity**: A feed of the latest complaints submitted in their area.

### 📋 Complaints Management (`/staff/complaints`)
- **The Core Inbox**: A data table of all complaints in the official's jurisdiction.
- **Filtering & Search**: Filter by status, category, urgency, or search by ID.
- **Actioning**: Click a complaint to view details, media, and location.
- **Updating Status**: Change the status (e.g., Pending -> In Progress -> Resolved).
- **Adding Remarks**: Leave official notes explaining how the issue was fixed, which the citizen will see.

### 👥 Staff Delegation (`/staff/users`)
- A page to manage the roles of other people.
- Staff can search for user profiles and upgrade them to lower-tier staff roles within their own region. (e.g., A City Manager of "Mumbai" can make someone a Ward Manager in "Andheri", but *cannot* make someone a City Manager of "Delhi").

### 🔐 User Accounts (`/staff/accounts`) - *Superadmin Only*
- **Global User Directory**: Lists every single registered Appwrite account in the system regardless of whether they have completed their profile.
- **Detailed Info**: Shows verification status, join date, exact email, and current role.
- **Delete Account**: Superadmins have the dangerous capability to permanently delete user accounts and their associated data. Protects against self-deletion.

### 📈 App Stats (`/staff/stats`) - *Superadmin Only*
- **Global Overview**: The "Control Room" view. Shows platform health.
- **Metrics**: Total users, total complaints globally, resolution rate %, weekly trends showing growth.
- **System Health**: A quick check on how many system errors have been logged recently.

### 🚨 System Errors (`/staff/errors`) - *Superadmin Only*
- A technical log of API errors, failed background jobs, and database issues.
- Helps developers and admins troubleshoot why a feature might be failing without needing SSH access to the server.

### 🤖 AI Model Trainer (`/staff/train-ai`) - *Staff Only*
- Upload categorized images of civic issues (potholes, garbage, etc.) directly in the browser.
- Trains a custom MobileNetV2 transfer learning model using TensorFlow.js.
- Downloads the resulting `model.json`, `model.weights.bin`, and `class_indices.json` files.
- Place these files in `public/models/civicshakti/` — the app detects and uses them automatically.

### 🟢 Public Status Page (`/status`)
- Displays real-time health checks for all backend services (API, Database, Auth, Storage, AI).
- Shows individual latency measurements and operational status for each service.
- Accessible to all users without logging in.

---

## 6. Hierarchical Delegation System
The most powerful feature of CivicShakti is how it distributes workload without requiring the central Superadmin to manage thousands of local officials.

**Rule 1: Downward Delegation**
You can only assign roles *below* your own rank. 
* *State Mgr -> Can create City/Village/Ward Mgrs.*
* *City Mgr -> Can create Village/Ward Mgrs.*
* *Ward Mgr -> Cannot assign roles to anyone.*

**Rule 2: Geographic Containment (Jurisdiction limit)**
You can only assign roles *inside* your borders.
* If you are a City Manager for `Pune` in `Maharashtra`:
  * You *can* create a Ward Manager for `Ward 5` in `Pune`, `Maharashtra`.
  * The system will **force** the State and City to be `Maharashtra` and `Pune` for that new Ward Manager. They cannot escape your borders.

---

## 7. Technical Stack & Integrations
For developers maintaining the system:
- **Frontend / Backend**: Next.js 16 (App Router, Turbopack) with React 19, TypeScript, and Tailwind CSS 4.
- **UI Components**: Shadcn UI (Radix UI primitives), Lucide Icons, Recharts for graphs.
- **Database & Auth**: Appwrite (Self-hosted or Cloud). Manages Auth, Databases (Profiles, Complaints, Error Logs), and Storage (Media uploads).
- **AI Engine**: Dual-pipeline — Google Gemini 2.0 Flash Vision API (with few-shot prompting for Indian civic context) + TensorFlow.js (MobileNet V2 + COCO-SSD + custom trained model).
- **API Architecture**: Next.js Route Handlers (`/api/...`). Server-side code uses `@node-appwrite` SDK using a secure API Key to bypass complex user ACLs when necessary.
- **Security**: JWT-based session verification (`getAuthJWT()`) on all protective API routes, combined with strict Role-Based Access Control (RBAC) checking the user's `labels`.
- **Maps**: Leaflet.js with React-Leaflet for geographic heatmaps.
- **Deployment**: Vercel (serverless). All API routes are serverless-compatible.

---
*Created for CivicShakti Admins and Developers.*
