# RTV Inventory Hub - Database Integration Guide

## Current Architecture
- **Frontend**: HTML, CSS, JavaScript
- **Data Storage**: localStorage (client-side only)
- **Users**: Admin and Supervisors
- **Features**: Inventory, Reports, Transfers, Settings

## Required Changes for Database Integration

### Option 1: Node.js + Express + MySQL/PostgreSQL (RECOMMENDED)
**Best for**: Full-featured web application with scalability

### Option 2: Node.js + Express + MongoDB
**Best for**: Flexible schema, rapid development

### Option 3: Python + Flask + PostgreSQL
**Best for**: Data analysis and reporting features

### Option 4: Firebase/Supabase (Serverless)
**Best for**: Quick deployment, minimal backend management

---

## Step-by-Step Implementation Plan

### Phase 1: Backend Setup (Node.js + Express + PostgreSQL)

#### 1. Initialize Project
```bash
mkdir rtv-inventory-backend
cd rtv-inventory-backend
npm init -y
npm install express cors dotenv postgresql pg bcryptjs jsonwebtoken multer
npm install --save-dev nodemon
```

#### 2. Database Schema
Create users, supervisors, inventory items, transfers, and reports tables

#### 3. API Endpoints Needed
- **Authentication**: POST /api/auth/login, POST /api/auth/logout
- **Users**: GET/POST/PUT/DELETE /api/users (admin only)
- **Inventory**: GET/POST/PUT/DELETE /api/inventory
- **Transfers**: GET/POST /api/transfers
- **Reports**: GET /api/reports
- **Settings**: GET/PUT /api/settings

### Phase 2: Frontend Updates

#### 1. Remove localStorage Dependencies
Replace all `localStorage.getItem/setItem` with API calls

#### 2. Add Fetch Wrapper
Create a utility function for API requests with authentication

#### 3. Add Loading States
Show spinners/loaders during API calls

#### 4. Error Handling
Implement proper error messages for failed API requests

### Phase 3: Deployment
- Deploy backend to Heroku, Railway, or DigitalOcean
- Host frontend on Netlify, Vercel, or same server as backend

---

## Database Schema Overview

### Users Table
```
id (UUID)
username (unique)
password (hashed)
role (admin/supervisor)
email
created_at
updated_at
```

### Supervisors Table
```
id (UUID)
user_id (FK)
name
district
status (active/inactive)
assigned_areas (JSON)
```

### Inventory Items Table
```
id (UUID)
name
description
category
quantity
unit
location
last_updated
updated_by (FK to users)
```

### Transfers Table
```
id (UUID)
item_id (FK)
from_location
to_location
quantity
transfer_date
transferred_by (FK to users)
status
```

### Reports Table
```
id (UUID)
title
type (inventory/transfer/etc)
generated_date
generated_by (FK to users)
data (JSON)
```

---

## Security Considerations
✅ Hash passwords with bcryptjs
✅ Use JWT tokens for authentication
✅ Validate all inputs (server-side)
✅ Use HTTPS in production
✅ Implement CORS properly
✅ Rate limiting on auth endpoints
✅ Store sensitive data in .env file
✅ Implement role-based access control (RBAC)

---

## Files to be Generated
1. ✅ Backend starter template (Node.js + Express)
2. ✅ Database initialization script
3. ✅ API endpoint examples
4. ✅ Frontend API utility functions
5. ✅ Environment configuration template
6. ✅ Docker setup (optional)
7. ✅ Deployment guide