<div align="center">

<img src="https://img.shields.io/badge/MotoFix-Two--Wheeler%20Service%20Platform-F5C000?style=for-the-badge&logo=motorcycle&logoColor=black" alt="MotoFix" height="50"/>

# 🏍️ MotoFix — Smart Two-Wheeler Service Management Platform

**A full-stack, security-hardened MERN application for modern motorcycle workshop management**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](LICENSE)

> A production-grade platform connecting motorcycle owners with certified service workshops — featuring AI-powered chat, dual-gateway payments, real-time messaging, and enterprise-level security architecture.

[🚀 Live Demo](#) · [📖 API Docs](#api-documentation) · [🐛 Report Bug](https://github.com/dipen-dra/MotoFix-backend/issues) · [✨ Request Feature](https://github.com/dipen-dra/MotoFix-backend/issues)

</div>

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [System Architecture](#-system-architecture)
4. [Technology Stack](#-technology-stack)
5. [Database Schema & Entity Relationships](#-database-schema--entity-relationships)
6. [Complete API Documentation](#-complete-api-documentation)
7. [Application Flow Diagrams](#-application-flow-diagrams)
8. [Security Architecture](#-security-architecture)
9. [Payment Integration Flow](#-payment-integration-flow)
10. [Real-Time Chat System](#-real-time-chat-system)
11. [AI Chatbot Integration](#-ai-chatbot-integration)
12. [Project Structure](#-project-structure)
13. [Getting Started](#-getting-started)
14. [Environment Variables](#-environment-variables)
15. [Running Tests](#-running-tests)
16. [Deployment Guide](#-deployment-guide)
17. [Security Hardening Summary](#-security-hardening-summary)
18. [Contributing](#-contributing)

---

## 🎯 Overview

**MotoFix** is a comprehensive, enterprise-grade MERN stack web application purpose-built for two-wheeler workshop management. It bridges the gap between motorcycle owners seeking reliable service and workshop operators who need an efficient management system.

### The Problem We Solve

| Pain Point | MotoFix Solution |
|---|---|
| No transparency in service pricing | Real-time service catalog with fixed, admin-managed pricing |
| Difficult booking process | Streamlined online booking with date & bike-model selection |
| Unsafe payment methods | Dual-gateway payments (eSewa & Khalti) with server-side amount validation |
| Poor customer-workshop communication | Real-time Socket.IO chat with file sharing |
| No post-service feedback loop | Integrated rating & review system per booking |
| No AI assistance for troubleshooting | Gemini 1.5 Flash-powered motorcycle AI assistant |
| Manual invoice generation | Automated PDF invoice with Puppeteer on booking completion |

### Who Is This For?

```
┌─────────────────────────────────────────────────────────────────┐
│                         MotoFix Users                           │
├──────────────────┬──────────────────┬───────────────────────────┤
│   🧑 Customers   │   👨‍🔧 Workshop Admins │   🤖 AI Assistant Users  │
│                  │                  │                           │
│ • Book services  │ • Manage bookings│ • Get instant bike advice │
│ • Track history  │ • Handle users   │ • Troubleshoot symptoms   │
│ • Pay online     │ • View analytics │ • Learn about services    │
│ • Chat & review  │ • Chat with      │ • 24/7 availability       │
│ • Earn points    │   customers      │                           │
└──────────────────┴──────────────────┴───────────────────────────┘
```

---

## ✨ Key Features

### 👤 Customer Features
- **Secure Authentication** — JWT-based auth with HttpOnly cookies; dual-mode (cookie + Bearer header)
- **Service Browsing** — Dynamic catalog fetched from database with images, pricing, and reviews
- **Smart Booking** — Select service, date, bike model; optional pickup/dropoff with distance-based pricing
- **Dual Payment Gateways** — Pay via **eSewa** (HMAC-SHA256 signed) or **Khalti** (REST API verified)
- **Booking History** — Paginated booking list with full status tracking (Pending → In Progress → Completed)
- **Cash on Delivery** — COD option for local pickups
- **Loyalty Points** — Earn 10–20 random points per completed booking
- **PDF Invoices** — Auto-generated PDF invoices on payment completion (Puppeteer)
- **Real-time Chat** — Socket.IO powered messaging with the workshop
- **Reviews & Ratings** — 1–5 star review system, one review per booking
- **AI Motorcycle Assistant** — Gemini 1.5 Flash for instant motorcycle advice
- **Profile Management** — Edit name, phone, address, upload profile picture

### 🛠️ Admin Features
- **Analytics Dashboard** — Total revenue, bookings, new users, monthly revenue charts (Recharts)
- **Booking Management** — View, update status, cancel bookings; admin archive support
- **User Management** — List, promote/demote, ban/delete users with role assignment
- **Service Management** — Full CRUD for services (name, description, price, image, duration)
- **Workshop Profile** — Manage workshop info, pickup/dropoff toggle, per-km pricing
- **Real-time Chat** — Respond to customer queries via Socket.IO
- **Audit Logs** — Winston daily-rotating logs (access, audit, error categories)

### 🔒 Security Features
- Helmet HTTP headers, strict CORS whitelisting
- Global + auth-specific rate limiting (DDoS protection)
- HttpOnly cookie JWT storage (XSS token hijacking prevention)
- HMAC-SHA256 signed eSewa transactions
- Server-side payment amount validation (anti-tampering)
- Null byte + double-extension file upload guards (RCE prevention)
- XSS recursive body sanitizer
- HTTP Parameter Pollution (HPP) prevention
- Strong password policy (8+ chars, upper, lower, digit, special)
- Password history tracking (last 5, no reuse)
- Name-based password ban
- DOMPurify client-side sanitization on chatbot output
- CSRF protection via SameSite cookie policy

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     React 18 SPA (Vite + TailwindCSS)               │   │
│  │                                                                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │ HomePage │  │  Admin   │  │  User    │  │   Auth Pages     │   │   │
│  │  │          │  │Dashboard │  │Dashboard │  │ Login/Register   │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌──────────────────────┐  ┌───────────────────────────────────┐   │   │
│  │  │  Socket.IO Client    │  │   Axios (withCredentials: true)   │   │   │
│  │  └──────────────────────┘  └───────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │ HTTPS
                                    │ HttpOnly Cookies
                                    │ Bearer Tokens (fallback)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY LAYER                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Express.js 5 REST API Server                     │   │
│  │                         Port :5050                                  │   │
│  │                                                                     │   │
│  │  🛡️ Security Middleware Stack (in order):                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │   │
│  │  │ Helmet   │→│  CORS    │→│Rate Limit│→│ Body     │→│ XSS     │  │   │
│  │  │ Headers  │ │Whitelist │ │(Global + │ │ Parser   │ │Sanitizer│  │   │
│  │  │          │ │          │ │  Auth)   │ │+Cookie   │ │         │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ │Parser   │ └─────────┘  │   │
│  │                                          │+ HPP    │              │   │
│  │                                          └──────────┘              │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │                   Winston Request Logger                      │  │   │
│  │  │          [access.log] [audit.log] [error.log]                 │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Route Handlers                               │   │
│  │  /api/auth  /api/user  /api/admin  /api/payment/esewa  /api/gemini  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                   ┌────────────────┼──────────────────┐
                   ▼                ▼                  ▼
┌────────────────────┐  ┌─────────────────┐  ┌──────────────────────┐
│   MongoDB Atlas    │  │   Socket.IO     │  │  External Services   │
│                    │  │   Real-time     │  │                      │
│  Collections:      │  │   Server        │  │  • eSewa Gateway     │
│  • users           │  │                 │  │  • Khalti API        │
│  • bookings        │  │  Events:        │  │  • Gmail SMTP        │
│  • services        │  │  • join_room    │  │  • Gemini 1.5 Flash  │
│  • messages        │  │  • send_message │  │  • Google Maps API   │
│  • workshops       │  │  • chat_history │  │                      │
└────────────────────┘  └─────────────────┘  └──────────────────────┘
```

### Microservice Flow Overview

```
                    ┌─────────────────┐
                    │   User Browser  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  React Router   │
                    │  (Client-side)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼────┐  ┌──────▼─────┐  ┌───▼──────────┐
     │  Public     │  │  User      │  │  Admin       │
     │  Routes     │  │  Routes    │  │  Routes      │
     │  /          │  │  /user/*   │  │  /admin/*    │
     │  /login     │  │            │  │              │
     │  /register  │  │  Protected │  │  Protected   │
     └─────────────┘  │  (JWT +    │  │  (JWT +      │
                      │  Role=user)│  │  Role=admin) │
                      └────────────┘  └──────────────┘
```

---

## 💻 Technology Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 18+ | Runtime environment |
| **Express.js** | 5.x | REST API framework |
| **MongoDB** | 8.x (Mongoose) | Primary database (ODM) |
| **Socket.IO** | 4.x | Real-time WebSocket communication |
| **JWT (jsonwebtoken)** | 9.x | Stateless authentication tokens |
| **bcrypt** | 6.x | Password hashing (10 salt rounds) |
| **Helmet** | 8.x | HTTP security headers |
| **cors** | 2.x | Cross-Origin Resource Sharing control |
| **express-rate-limit** | 8.x | DDoS & brute force protection |
| **cookie-parser** | 1.4.x | HttpOnly cookie parsing |
| **hpp** | 0.2.x | HTTP Parameter Pollution prevention |
| **multer** | 2.x | Multipart file upload handling |
| **nodemailer** | 7.x | SMTP email (password reset) |
| **puppeteer** | 24.x | Headless PDF invoice generation |
| **winston** | 3.x | Structured logging |
| **winston-daily-rotate-file** | 5.x | Log file rotation (90-day retention) |
| **@google/generative-ai** | 0.24.x | Gemini AI integration |
| **axios** | 1.x | Internal HTTP requests (Khalti verification) |
| **uuid** | 11.x | Unique ID generation for file uploads |
| **node-fetch** | 2.x | Server-side eSewa API calls |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.x | UI component library |
| **Vite** | 6.x | Build tool & dev server |
| **TailwindCSS** | 3.x | Utility-first CSS framework |
| **React Router DOM** | 6.x | Client-side routing |
| **Redux Toolkit** | 2.x | Global state management |
| **@tanstack/react-query** | 5.x | Server state & data fetching |
| **Axios** | 1.x | HTTP client (withCredentials: true) |
| **Socket.IO Client** | 4.x | Real-time chat connection |
| **DOMPurify** | Latest | Client-side XSS sanitization |
| **Recharts** | 2.x | Analytics charts & graphs |
| **lucide-react** | 0.51x | Icon library |
| **react-hook-form** | 7.x | Form state & validation |
| **react-hot-toast** | 2.x | Toast notifications |
| **react-toastify** | 11.x | Advanced toast system |
| **lottie-react** | 2.x | Lottie animation support |
| **@google/generative-ai** | 0.24.x | Client Gemini SDK |

### DevOps & Testing

| Tool | Purpose |
|---|---|
| **Jest + Supertest** | Backend API integration testing |
| **Vitest + Testing Library** | Frontend unit & component testing |
| **Nodemon** | Backend hot-reload during development |
| **ESLint** | JavaScript/React code linting |
| **Autoprefixer + PostCSS** | CSS vendor prefix processing |

---

## 🗄️ Database Schema & Entity Relationships

### Entity Relationship Diagram

```
┌──────────────────────────────────┐
│              USER                │
├──────────────────────────────────┤
│ _id         : ObjectId (PK)      │
│ fullName     : String (required)  │
│ email        : String (unique)    │
│ password     : String (bcrypt)    │
│ role         : String (normal|admin)│
│ phone        : String             │
│ address      : String             │
│ profilePicture: String (path)     │
│ loyaltyPoints : Number (default:0)│
│ passwordHistory: [String] (BCrypt)│
│ lastPasswordChange: Date          │
│ createdAt    : Date (auto)        │
│ updatedAt    : Date (auto)        │
└──────────────────────────────────┘
         │ 1
         │
         │ has many
         │
         ▼ N
┌──────────────────────────────────┐     ┌──────────────────────────────┐
│            BOOKING               │     │           SERVICE            │
├──────────────────────────────────┤     ├──────────────────────────────┤
│ _id          : ObjectId (PK)     │     │ _id       : ObjectId (PK)    │
│ customer     : ObjectId (→User)  │ N   │ name      : String (unique)  │
│ service      : ObjectId (→Svc) ──┼─────│ description: String          │
│ bikeModel    : String            │ 1   │ price     : Number           │
│ customerName : String            │     │ duration  : String           │
│ serviceType  : String            │     │ image     : String (path)    │
│ status       : Enum              │     │ rating    : Number (0-5)     │
│   Pending|InProgress|Completed   │     │ numReviews: Number           │
│   |Cancelled                     │     │ reviews   : [ReviewSchema]   │
│ date         : Date              │     │ createdAt : Date             │
│ notes        : String            │     │ updatedAt : Date             │
│ totalCost    : Number            │     └──────────────────────────────┘
│ discountApplied: Boolean         │              │
│ discountAmount : Number          │              │ embeds
│ finalAmount   : Number           │              ▼
│ paymentStatus : Enum             │     ┌──────────────────────────────┐
│   Pending|Paid|Failed            │     │         REVIEW               │
│ paymentMethod : Enum             │     ├──────────────────────────────┤
│   COD|Khalti|eSewa|Not Selected  │     │ user     : ObjectId (→User)  │
│ isPaid        : Boolean          │     │ username  : String           │
│ pointsAwarded : Number           │     │ rating    : Number (1-5)     │
│ reviewSubmitted: Boolean         │     │ comment   : String (≤500)    │
│ archivedByAdmin: Boolean         │     │ createdAt : Date             │
│ requestedPickupDropoff: Boolean  │     └──────────────────────────────┘
│ pickupAddress : String           │
│ dropoffAddress: String           │
│ pickupCoordinates : {lat,lng}    │
│ dropoffCoordinates: {lat,lng}    │
│ pickupDropoffDistance: Number    │
│ pickupDropoffCost : Number       │
│ createdAt     : Date (auto)      │
│ updatedAt     : Date (auto)      │
└──────────────────────────────────┘

┌──────────────────────────────────┐     ┌──────────────────────────────┐
│            MESSAGE               │     │          WORKSHOP            │
├──────────────────────────────────┤     ├──────────────────────────────┤
│ _id          : ObjectId (PK)     │     │ _id       : ObjectId (PK)    │
│ room         : String (indexed)  │     │ ownerName : String           │
│ author       : String            │     │ workshopName: String         │
│ authorId     : String            │     │ email     : String (unique)  │
│ message      : String            │     │ phone     : String           │
│ fileUrl      : String            │     │ address   : String           │
│ fileName     : String            │     │ profilePicture: String       │
│ fileType     : String            │     │ offerPickupDropoff: Boolean  │
│ isRead       : Boolean           │     │ pickupDropoffChargePerKm:    │
│ clearedForUser: Boolean          │     │            Number            │
│ clearedForAdmin: Boolean         │     │ createdAt : Date             │
│ createdAt    : Date              │     └──────────────────────────────┘
└──────────────────────────────────┘
```

### Booking Status State Machine

```
                    ┌───────────┐
              ┌────▶│  Pending  │◀──────────────┐
              │     └─────┬─────┘               │
    (Re-open) │           │ (Admin accepts)      │ (Admin creates)
              │           ▼                     │
              │     ┌─────────────┐             │
              │     │ In Progress │             │
              │     └─────┬───────┘             │
              │           │ (Service done)       │
              │           ▼                     │
              │     ┌─────────────┐             │
              │     │  Completed  │             │
              │     └─────────────┘             │
              │                                 │
              │     ┌─────────────┐             │
              └─────│  Cancelled  │─────────────┘
                    └─────────────┘
                    (Any stage → Admin or User)
```

### Payment Status State Machine

```
    ┌─────────┐    (Payment initiated)    ┌──────────┐
    │ Pending │──────────────────────────▶│  Paid    │
    └────┬────┘                           └──────────┘
         │
         │ (Payment rejected / timeout)
         ▼
    ┌─────────┐
    │  Failed │
    └─────────┘
```

---

## 📡 Complete API Documentation

### Base URLs

| Environment | Backend URL | Frontend URL |
|---|---|---|
| Development | `http://localhost:5050` | `http://localhost:5173` |

### Authentication Endpoints (`/api/auth`)

> Rate Limited: **15 requests / 15 minutes** per IP

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register a new user account |
| `POST` | `/api/auth/login` | ❌ | Login and receive HttpOnly cookie + token |
| `POST` | `/api/auth/logout` | ❌ | Clear session cookie |
| `POST` | `/api/auth/forgot-password` | ❌ | Send password reset email |
| `POST` | `/api/auth/reset-password/:token` | ❌ | Reset password with valid JWT token |

**POST `/api/auth/register`**
```json
// Request Body
{
  "email": "user@example.com",
  "fullName": "John Doe",
  "password": "MySecure@Pass1"
}

// Response 201
{
  "success": true,
  "message": "User 'John Doe' registered successfully.",
  "data": {
    "id": "64abc...",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "normal"
  }
}
```

**POST `/api/auth/login`**
```json
// Request Body
{
  "email": "user@example.com",
  "password": "MySecure@Pass1"
}

// Response 200
{
  "success": true,
  "message": "Login successful",
  "data": { "_id": "64abc...", "email": "...", "fullName": "...", "role": "normal" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
// Also sets: Set-Cookie: token=...; HttpOnly; SameSite=Lax; Max-Age=604800
```

---

### Public Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/public/services` | ❌ | Fetch all available services (landing page) |

---

### User Endpoints (`/api/user`)

> All require JWT (HttpOnly Cookie or `Authorization: Bearer <token>`)

#### Bookings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/bookings` | Get paginated user bookings |
| `GET` | `/api/user/bookings/pending` | Get pending (unpaid) bookings |
| `GET` | `/api/user/bookings/history` | Get paid booking history |
| `GET` | `/api/user/bookings/:id` | Get single booking by ID |
| `POST` | `/api/user/bookings` | Create a new service booking |
| `PUT` | `/api/user/bookings/:id/cancel` | Cancel a booking |
| `GET` | `/api/user/bookings/:id/invoice` | Download PDF invoice |
| `POST` | `/api/user/bookings/initiate-khalti` | Initiate Khalti payment |
| `POST` | `/api/user/bookings/verify-khalti` | Verify Khalti payment callback |

**POST `/api/user/bookings`**
```json
// Request Body
{
  "serviceId": "64xyz...",
  "bikeModel": "Honda CB Shine",
  "date": "2026-06-15",
  "notes": "Engine making clicking sound",
  "requestedPickupDropoff": true,
  "pickupAddress": "Kathmandu, Nepal",
  "dropoffAddress": "MotoFix Workshop"
}

// Response 201
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "_id": "64def...",
    "status": "Pending",
    "totalCost": 1500,
    "finalAmount": 1700,
    "paymentMethod": "Not Selected"
  }
}
```

#### Services

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/services` | List all services |
| `GET` | `/api/user/services/:id` | Get single service |

#### Profile

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/profile` | Get logged-in user profile |
| `PUT` | `/api/user/profile` | Update profile info |
| `POST` | `/api/user/profile/picture` | Upload profile picture (multipart) |

#### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/dashboard` | Get user summary stats |

#### Chat

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/user/chat/send` | Send chat message |
| `POST` | `/api/user/chat/clear` | Clear user's chat history |

---

### Admin Endpoints (`/api/admin`)

> All require JWT with `role: 'admin'`

#### User Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/users` | List all users |
| `GET` | `/api/admin/users/:id` | Get single user |
| `PUT` | `/api/admin/users/:id` | Update user (role, ban, etc.) |
| `DELETE` | `/api/admin/users/:id` | Delete a user |

#### Booking Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/bookings` | List all bookings |
| `PUT` | `/api/admin/bookings/:id/status` | Update booking status |
| `PUT` | `/api/admin/bookings/:id/archive` | Archive a booking |
| `DELETE` | `/api/admin/bookings/:id` | Delete a booking |

#### Service Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/services` | List all services |
| `POST` | `/api/admin/services` | Create new service (multipart) |
| `PUT` | `/api/admin/services/:id` | Update service |
| `DELETE` | `/api/admin/services/:id` | Delete service |

#### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/dashboard` | Get analytics (revenue, bookings, users) |

#### Profile (Workshop)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/profile` | Get workshop profile |
| `PUT` | `/api/admin/profile` | Update workshop settings |
| `POST` | `/api/admin/profile/picture` | Upload workshop logo |

#### Chat

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/chat/rooms` | List all active chat rooms |
| `POST` | `/api/admin/chat/clear` | Clear admin's side of a chat |

---

### Payment Endpoints

#### eSewa (`/api/payment/esewa`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/payment/esewa/initiate` | ✅ | Generate signed eSewa form data |
| `GET` | `/api/payment/esewa/verify` | ❌ | Handle eSewa redirect callback |

#### Khalti (via `/api/user/bookings`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/user/bookings/initiate-khalti` | ✅ | Prepare Khalti order |
| `POST` | `/api/user/bookings/verify-khalti` | ✅ | Verify Khalti payment |

---

### AI Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/gemini/chat` | ❌ | Send message to Gemini AI assistant |

**POST `/api/gemini/chat`**
```json
// Request Body
{
  "message": "My bike engine is overheating, what should I do?",
  "history": [
    { "role": "user", "parts": [{ "text": "Hello" }] },
    { "role": "model", "parts": [{ "text": "Hi! How can I help?" }] }
  ]
}

// Response 200
{
  "response": "Engine overheating can be caused by several issues..."
}
```

---

### Review Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/reviews/:bookingId` | ✅ | Submit a review for a completed booking |
| `GET` | `/api/reviews/:serviceId` | ❌ | Get reviews for a service |

---

## 🔄 Application Flow Diagrams

### 1. Complete User Registration & Login Flow

```
  User Browser                  React App                    Express API              MongoDB
       │                            │                             │                      │
       │  Fill signup form          │                             │                      │
       │──────────────────────────▶│                             │                      │
       │                            │  POST /api/auth/register   │                      │
       │                            │───────────────────────────▶│                      │
       │                            │                             │ Validate body fields │
       │                            │                             │─────────────────────▶│
       │                            │                             │ Check existing email │
       │                            │                             │─────────────────────▶│
       │                            │                             │  Found? → 409        │
       │                            │                             │  Not Found? Continue │
       │                            │                             │ Check name in passwd │
       │                            │                             │ Validate password    │
       │                            │                             │   complexity rules   │
       │                            │                             │ bcrypt.hash(passwd)  │
       │                            │                             │ Create new User doc  │
       │                            │                             │─────────────────────▶│
       │                            │                             │◀─────────────────────│
       │                            │  201 { success, data }     │                      │
       │                            │◀───────────────────────────│                      │
       │  Redirect to login page    │                             │                      │
       │◀──────────────────────────│                             │                      │
       │                            │                             │                      │
       │  Fill login form           │                             │                      │
       │──────────────────────────▶│                             │                      │
       │                            │  POST /api/auth/login      │                      │
       │                            │───────────────────────────▶│                      │
       │                            │                             │ findOne({ email })   │
       │                            │                             │─────────────────────▶│
       │                            │                             │ bcrypt.compare()     │
       │                            │                             │ jwt.sign(payload)    │
       │                            │                             │ Set-Cookie: token=   │
       │                            │                             │ httpOnly, SameSite   │
       │  Set HttpOnly Cookie       │                             │                      │
       │◀──────────────────────────│◀───────────────────────────│                      │
       │  Store token in context    │                             │                      │
       │  Redirect to /user or      │                             │                      │
       │  /admin based on role      │                             │                      │
```

### 2. Complete Booking & Payment Flow

```
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │                     BOOKING CREATION FLOW                                    │
  └──────────────────────────────────────────────────────────────────────────────┘

  User selects service ──▶ Fills booking form ──▶ POST /api/user/bookings
                                                          │
                                              ┌───────────▼────────────────┐
                                              │  Backend validates:        │
                                              │  • JWT authentication      │
                                              │  • Service exists in DB    │
                                              │  • Date in future          │
                                              │  • Bike model not empty    │
                                              └───────────┬────────────────┘
                                                          │
                                              ┌───────────▼────────────────┐
                                              │  Calculate costs:          │
                                              │  • Base service price      │
                                              │  • Pickup/dropoff distance │
                                              │  • Loyalty discount (if    │
                                              │    points ≥ threshold)     │
                                              │  • finalAmount stored      │
                                              └───────────┬────────────────┘
                                                          │
                                              ┌───────────▼────────────────┐
                                              │  Save Booking to MongoDB   │
                                              │  Status: "Pending"         │
                                              │  PaymentStatus: "Pending"  │
                                              └───────────┬────────────────┘
                                                          │
                                              ┌───────────▼────────────────┐
                                              │  Send email confirmation   │
                                              │  (Nodemailer/Gmail SMTP)   │
                                              └───────────┬────────────────┘
                                                          │
                                              Return booking data to client

  ┌──────────────────────────────────────────────────────────────────────────────┐
  │                     PAYMENT SELECTION FLOW                                   │
  └──────────────────────────────────────────────────────────────────────────────┘

  User selects payment method:
  ┌────────────────┐     ┌─────────────────┐     ┌─────────────────┐
  │   Cash on      │     │    eSewa         │     │    Khalti        │
  │   Delivery     │     │   (Nepal)        │     │   (Nepal)        │
  └───────┬────────┘     └────────┬────────┘     └────────┬────────┘
          │                       │                        │
          ▼                       ▼                        ▼
  Mark COD, send        POST /api/payment/        POST /api/user/
  confirmation email    esewa/initiate            bookings/initiate-khalti
                               │                        │
                        Generate HMAC-SHA256     Return Khalti
                        signed form data         payment URL
                               │                        │
                        Redirect to              Redirect to
                        eSewa gateway            Khalti widget
                               │                        │
                        eSewa redirects          Khalti returns
                        to /payment/esewa/       pidx token
                        success?data=base64             │
                               │                 POST /verify-khalti
                        GET /api/payment/              │
                        esewa/verify?data=             │
                               │                        │
                  ┌────────────▼────────────────────────▼───────────────────┐
                  │           Server-side AMOUNT VALIDATION                  │
                  │                                                          │
                  │  1. Decode payment response from gateway                │
                  │  2. Load booking.finalAmount from MongoDB               │
                  │  3. Compare: gateway_amount === db_finalAmount?         │
                  │  4. ❌ MISMATCH → Reject (Anti-tampering protection)   │
                  │  5. ✅ MATCH  → Mark isPaid=true, paymentStatus=Paid   │
                  │  6. Award loyalty points (10–20 random)                 │
                  │  7. Generate PDF invoice via Puppeteer                  │
                  │  8. Send success email with invoice attachment          │
                  └──────────────────────────────────────────────────────────┘
```

### 3. Admin Booking Management Flow

```
  Admin Dashboard
       │
       ├──▶ View all bookings (GET /api/admin/bookings)
       │          │
       │          ▼
       │    Booking List with filters
       │    [Pending] [In Progress] [Completed] [Cancelled]
       │          │
       │          ▼
       │    Click booking → View details
       │          │
       │          ├──▶ Update Status (PUT /api/admin/bookings/:id/status)
       │          │         Pending → In Progress → Completed
       │          │
       │          ├──▶ Archive (soft delete for admin view)
       │          │
       │          └──▶ Delete (hard delete)
       │
       ├──▶ Analytics (GET /api/admin/dashboard)
       │          │
       │          ▼
       │    • Total Revenue (aggregate sum)
       │    • Total Bookings (count)
       │    • New Users This Month
       │    • Monthly Revenue Chart (Recharts)
       │    • Service Distribution Chart
       │    • Recent 5 Bookings Table
       │
       └──▶ User Management
                  │
                  ├──▶ List all users
                  ├──▶ Promote to admin
                  └──▶ Delete user (cascades booking cleanup)
```

### 4. Password Reset Flow

```
  User                React App              Backend                Gmail SMTP
    │                     │                      │                      │
    │ Forget Password      │                      │                      │
    │ Enter email          │                      │                      │
    │─────────────────────▶│                      │                      │
    │                      │ POST /forgot-password│                      │
    │                      │─────────────────────▶│                      │
    │                      │                      │ findOne({email})     │
    │                      │                      │                      │
    │                      │  ← EMAIL NOT FOUND   │                      │
    │                      │  404 error (no email │                      │
    │                      │  sent to invalid)    │                      │
    │                      │                      │                      │
    │                      │  ← EMAIL FOUND       │                      │
    │                      │                      │ jwt.sign({id},       │
    │                      │                      │   expiresIn: 15m)    │
    │                      │                      │ Build reset URL      │
    │                      │                      │─────────────────────▶│
    │                      │                      │                      │ Send email
    │ Receive email        │                      │                      │ with link
    │◀────────────────────────────────────────────────────────────────── │
    │                      │                      │                      │
    │ Click reset link     │                      │                      │
    │─────────────────────▶│                      │                      │
    │                      │ POST /reset-password/:token                 │
    │                      │─────────────────────▶│                      │
    │                      │                      │ jwt.verify(token)    │
    │                      │                      │ validateStrongPwd()  │
    │                      │                      │ Check name-ban       │
    │                      │                      │ Check history (5pwd) │
    │                      │                      │ bcrypt.hash(newPwd)  │
    │                      │                      │ Update user document │
    │  Success message     │◀─────────────────────│                      │
    │◀─────────────────────│                      │                      │
```

---

## 🔒 Security Architecture

### Defense-in-Depth Security Layers

```
                              ┌─────────────────────────────────┐
  REQUEST ARRIVES ──────────▶│    Layer 1: Helmet Headers       │
                              │ X-Content-Type-Options: nosniff  │
                              │ X-Frame-Options: DENY            │
                              │ Referrer-Policy: strict          │
                              └──────────────┬──────────────────┘
                                             │
                              ┌──────────────▼──────────────────┐
                              │    Layer 2: CORS Whitelist       │
                              │ Only allow: localhost:5173       │
                              │ Reject all other origins         │
                              └──────────────┬──────────────────┘
                                             │
                              ┌──────────────▼──────────────────┐
                              │    Layer 3: Rate Limiting        │
                              │ Global: 200 req/15min/IP         │
                              │ Auth: 15 req/15min/IP            │
                              └──────────────┬──────────────────┘
                                             │
                              ┌──────────────▼──────────────────┐
                              │    Layer 4: Body Parsing         │
                              │ HPP: Prevent param pollution     │
                              │ Cookie-Parser: Read HttpOnly     │
                              └──────────────┬──────────────────┘
                                             │
                              ┌──────────────▼──────────────────┐
                              │    Layer 5: XSS Sanitizer        │
                              │ Strip <script>, <iframe> tags    │
                              │ Recursive deep sanitization      │
                              └──────────────┬──────────────────┘
                                             │
                              ┌──────────────▼──────────────────┐
                              │    Layer 6: Authentication       │
                              │ 1. Check HttpOnly cookie.token   │
                              │ 2. Fallback: Authorization header│
                              │ 3. jwt.verify() → User lookup    │
                              └──────────────┬──────────────────┘
                                             │
                              ┌──────────────▼──────────────────┐
                              │    Layer 7: Authorization        │
                              │ isAdmin: role === 'admin'        │
                              │ IDOR: customer === req.user._id  │
                              └──────────────┬──────────────────┘
                                             │
                              ┌──────────────▼──────────────────┐
                              │    Layer 8: Input Validation     │
                              │ Payment amount server-validation │
                              │ File: null-byte + ext checks     │
                              │ Password complexity rules        │
                              └──────────────┬──────────────────┘
                                             │
                              ┌──────────────▼──────────────────┐
                              │    Layer 9: Logging (Winston)    │
                              │ access.log: 2xx traffic          │
                              │ audit.log: 401/403/429 events    │
                              │ error.log: 500 exceptions        │
                              │ Sensitive fields auto-redacted   │
                              └─────────────────────────────────┘
```

### Password Policy Enforcement

```
  Registration / Password Reset
           │
           ▼
  ┌────────────────────────────────────────────────────────┐
  │                PASSWORD POLICY RULES                   │
  │                                                        │
  │  ✅ Minimum 8 characters                               │
  │  ✅ At least 1 uppercase letter (A-Z)                  │
  │  ✅ At least 1 lowercase letter (a-z)                  │
  │  ✅ At least 1 numeric digit (0-9)                     │
  │  ✅ At least 1 special character (!@#$%^&*)             │
  │  ✅ Cannot contain user's full name parts              │
  │     (Excludes generic words: test, user, admin, rider) │
  │  ✅ Cannot reuse last 5 previous passwords             │
  │     (bcrypt-compared against passwordHistory array)    │
  └────────────────────────────────────────────────────────┘
  
  Frontend:
  Real-time password strength indicator during typing
  (SignupForm.jsx, ResetPasswordPage.jsx)
```

### Security Threat Matrix

| Threat | Protection Mechanism | Implementation |
|---|---|---|
| **XSS** | HttpOnly cookies + DOMPurify + Body sanitizer | Cookie: httpOnly, DOMPurify.sanitize() on bot output |
| **CSRF** | SameSite cookie policy | `sameSite: 'lax'` (dev), `'none'` (prod) |
| **SQL/NoSQL Injection** | Mongoose ODM parameterization | No raw MongoDB queries, schema types enforced |
| **DDoS / Brute Force** | Rate limiting | Global: 200/15min, Auth: 15/15min |
| **Path Traversal** | Multer file storage + validation | Files saved to /uploads with UUIDs, not originals |
| **RCE via File Upload** | Double extension + null byte filter | Regex blocks `.php.png`, `\0` in filename |
| **IDOR** | Ownership checks | `Booking.findOne({ _id, customer: req.user._id })` |
| **Payment Tampering** | Server-side amount validation | Gateway amount === DB `finalAmount` |
| **HTTP Parameter Pollution** | HPP middleware | `hpp()` removes duplicate query params |
| **Token Hijacking** | HttpOnly cookies | JS cannot access `document.cookie` token |
| **Sensitive Data Exposure** | Winston redaction | `[REDACTED]` for passwords/tokens in logs |
| **Missing Auth Headers** | Helmet | X-Content-Type, X-Frame-Options enforced |
| **Session Fixation** | JWT with short-lived reset tokens | Reset JWT expires in 15 minutes |
| **Bot Scraping** | Rate limiter | Aggressive rate limit on public endpoints |

---

## 💳 Payment Integration Flow

### eSewa Payment Integration (HMAC-SHA256)

```
  Frontend                  Backend                     eSewa Gateway
      │                        │                              │
      │ POST /initiate         │                              │
      │───────────────────────▶│                              │
      │                        │ Load booking from DB         │
      │                        │ Get finalAmount              │
      │                        │                              │
      │                        │ Build signature string:      │
      │                        │ "total_amount=X,             │
      │                        │  transaction_uuid=Y,         │
      │                        │  product_code=EPAYTEST"      │
      │                        │                              │
      │                        │ HMAC-SHA256(secret, string)  │
      │                        │ → base64 signature           │
      │                        │                              │
      │ Return signed form data│                              │
      │◀───────────────────────│                              │
      │                        │                              │
      │ Auto-submit HTML form  │                              │
      │─────────────────────────────────────────────────────▶│
      │                        │                              │ Process payment
      │                        │                              │
      │◀─────────────────────────────────────────────────────│
      │  Redirect to /payment/esewa/success?data=base64      │
      │                        │                              │
      │ GET /esewa/verify?data=│                              │
      │───────────────────────▶│                              │
      │                        │ Decode base64 JSON           │
      │                        │ status === 'COMPLETE'?       │
      │                        │ Load booking from MongoDB    │
      │                        │ ⚠️ VALIDATE:                  │
      │                        │ decoded.total_amount         │
      │                        │   === db.finalAmount?        │
      │                        │ ❌ Mismatch → REJECT         │
      │                        │ ✅ Match → Mark as Paid      │
      │                        │ Award loyalty points         │
      │                        │ Generate PDF invoice         │
      │                        │ Send email confirmation      │
      │ Render success page    │                              │
      │◀───────────────────────│                              │
```

### Khalti Payment Integration

```
  Frontend                  Backend                     Khalti API
      │                        │                              │
      │ POST /initiate-khalti  │                              │
      │───────────────────────▶│                              │
      │                        │ POST /epayment/initiate/     │
      │                        │───────────────────────────────▶
      │                        │                              │ Return pidx
      │                        │◀───────────────────────────────
      │ { pidx, payment_url }  │                              │
      │◀───────────────────────│                              │
      │                        │                              │
      │ Open Khalti widget     │                              │
      │─────────────────────────────────────────────────────▶│
      │                        │                              │ User pays
      │◀─────────────────────────────────────────────────────│
      │ Return pidx token      │                              │
      │                        │                              │
      │ POST /verify-khalti    │                              │
      │ { pidx, bookingId }    │                              │
      │───────────────────────▶│                              │
      │                        │ GET /epayment/lookup/        │
      │                        │───────────────────────────────▶
      │                        │                              │ Return { amount, status }
      │                        │◀───────────────────────────────
      │                        │ ⚠️ VALIDATE:                  │
      │                        │ khaltiResponse.amount / 100  │
      │                        │   === db.finalAmount?        │
      │                        │ ❌ Mismatch → REJECT         │
      │                        │ ✅ Match → Mark as Paid      │
      │ 200 { success: true }  │                              │
      │◀───────────────────────│                              │
```

---

## 💬 Real-Time Chat System

### Socket.IO Architecture

```
  User Browser              Socket.IO              Admin Browser
       │                      Server                     │
       │                        │                        │
       │ connect()              │                        │
       │───────────────────────▶│                        │
       │                        │                      connect()
       │                        │◀───────────────────────│
       │                        │                        │
       │ emit('join_room',      │                        │
       │      { roomName:       │                        │
       │        'user_123',     │                        │
       │        userId: '123'}) │                        │
       │───────────────────────▶│                        │
       │                        │ Mark messages as read  │
       │                        │ Emit chat_history      │
       │◀───────────────────────│                        │
       │                        │ emit('join_room',      │
       │                        │      { roomName:       │
       │                        │        'user_123',     │
       │                        │        userId:         │
       │                        │        'admin_user'})  │
       │                        │◀───────────────────────│
       │                        │                        │
       │ emit('send_message',   │                        │
       │      { room, author,   │                        │
       │        message })      │                        │
       │───────────────────────▶│                        │
       │                        │ Save to MongoDB        │
       │                        │ io.to(room).emit(      │
       │                        │   'receive_message')   │
       │◀───────────────────────│───────────────────────▶│
       │ Message displayed      │ Message displayed      │
       │                        │ Notification emitted   │
       │                        │───────────────────────▶│
```

**Chat Room Naming Convention:**
- Each user has a unique room: `user_<userId>`
- Admin joins any room to respond
- Message history filtered: `clearedForAdmin` / `clearedForUser` flags
- Supports file attachments (images up to 5MB)
- Last 100 messages loaded on join

---

## 🤖 AI Chatbot Integration

### Gemini 1.5 Flash Architecture

```
  User                GeminiChatbot.jsx            Backend                Gemini API
    │                       │                          │                       │
    │ Type message           │                          │                       │
    │───────────────────────▶│                          │                       │
    │                        │ POST /api/gemini/chat    │                       │
    │                        │ { message, history }     │                       │
    │                        │─────────────────────────▶│                       │
    │                        │                          │ GoogleGenerativeAI()  │
    │                        │                          │ model.startChat()     │
    │                        │                          │─────────────────────▶│
    │                        │                          │   Return response     │
    │                        │                          │◀─────────────────────│
    │                        │ { response: text }       │                       │
    │                        │◀─────────────────────────│                       │
    │                        │                          │                       │
    │                        │ DOMPurify.sanitize()     │                       │
    │                        │ Render safe HTML         │                       │
    │ See bot response       │                          │                       │
    │◀───────────────────────│                          │                       │
    │                        │                          │                       │
    │                        │ Update history array     │                       │
    │                        │ (for multi-turn context) │                       │
```

**System Instruction:** The AI is locked to motorcycle service domain. It answers about:
- Common bike problems (engine, brakes, tires, chain, oil)
- Service types and recommendations
- Symptom-based troubleshooting
- Maintenance schedules

**Guardrails:** Cannot access booking data, prices, or user accounts. Guides users to use the website for appointments.

---

## 📂 Project Structure

```
MotoFix/
├── MotoFix-backend/                    # Express.js REST API
│   ├── config/
│   │   └── db.js                       # MongoDB connection setup
│   │
│   ├── controllers/
│   │   ├── admin/
│   │   │   ├── bookingController.js    # Admin booking management
│   │   │   ├── chatController.js       # Admin chat operations
│   │   │   ├── dashboardController.js  # Analytics & revenue data
│   │   │   ├── profileController.js    # Workshop profile CRUD
│   │   │   ├── serviceController.js    # Admin service CRUD
│   │   │   └── usermanagement.js       # User CRUD & role management
│   │   ├── user/
│   │   │   ├── bookingController.js    # User booking + payments + PDF
│   │   │   ├── chatController.js       # User chat operations
│   │   │   ├── dashboardController.js  # User dashboard stats
│   │   │   ├── profileController.js    # User profile management
│   │   │   └── serviceController.js    # Service listing for users
│   │   ├── chatbotController.js        # Socket.IO chatbot controller
│   │   ├── esewaController.js          # eSewa payment gateway
│   │   ├── geminiController.js         # Gemini AI integration
│   │   ├── reviewController.js         # Review submission & retrieval
│   │   └── userController.js           # Auth: register/login/reset
│   │
│   ├── middlewares/
│   │   ├── authorizedUser.js           # JWT dual-mode auth middleware
│   │   ├── fileupload.js               # UUID-based file upload (Multer)
│   │   ├── requestLogger.js            # Winston HTTP request logger
│   │   └── upload.js                   # Image-only upload filter
│   │
│   ├── models/
│   │   ├── Booking.js                  # Booking schema
│   │   ├── Message.js                  # Chat message schema
│   │   ├── Service.js                  # Service + embedded review schema
│   │   ├── User.js                     # User schema with password history
│   │   └── Workshop.js                 # Workshop profile schema
│   │
│   ├── routes/
│   │   ├── admin/
│   │   │   ├── adminUserRoute.js
│   │   │   ├── bookingRoute.js
│   │   │   ├── chatRoute.js
│   │   │   ├── dashboardRoute.js
│   │   │   ├── profileRoute.js
│   │   │   └── serviceRoute.js
│   │   ├── user/
│   │   │   ├── bookingRoute.js
│   │   │   ├── chatRoute.js
│   │   │   ├── dashboardRoute.js
│   │   │   ├── profileRoute.js
│   │   │   └── serviceRoute.js
│   │   ├── chatbotRoute.js
│   │   ├── esewaRoute.js
│   │   ├── gemini.js
│   │   ├── reviewRoute.js
│   │   └── userRoute.js
│   │
│   ├── utils/
│   │   ├── invoiceTemplate.js          # Puppeteer PDF invoice generator
│   │   ├── logger.js                   # Winston 3-layer logging setup
│   │   └── sendEmail.js                # Nodemailer email utility
│   │
│   ├── uploads/                        # Uploaded files (gitignored)
│   ├── logs/                           # Rotating log files (gitignored)
│   ├── test/                           # Jest integration tests
│   ├── .env                            # Environment variables
│   ├── index.js                        # App entry point
│   ├── seeder.js                       # Database seeder (admin + services)
│   └── package.json
│
└── MotoFix-Frontend/                   # React 18 SPA
    ├── public/                         # Static assets
    ├── src/
    │   ├── api/
    │   │   ├── api.js                  # Global Axios instance (withCredentials)
    │   │   ├── authApi.js              # Auth API calls
    │   │   ├── chatbotApi.js           # Chatbot API client
    │   │   └── reviewService.js        # Review API client
    │   │
    │   ├── auth/
    │   │   └── AuthContext.jsx         # Global auth context + state
    │   │
    │   ├── components/
    │   │   ├── auth/
    │   │   │   ├── LoginForm.jsx       # Login with validation
    │   │   │   └── SignupForm.jsx      # Register with pwd strength UI
    │   │   ├── chatbot/
    │   │   │   ├── Chatbot.jsx         # Legacy chatbot (DOMPurify secured)
    │   │   │   └── chatbot.css
    │   │   ├── GeminiChatbot.jsx       # Active Gemini AI chat UI
    │   │   └── GeminiChatbot.css
    │   │
    │   ├── pages/
    │   │   ├── admin/
    │   │   │   └── adminDashboard.jsx  # Full admin panel SPA
    │   │   ├── user/
    │   │   │   └── UserDashboard.jsx   # Full user panel SPA
    │   │   ├── AuthPage.jsx            # Combined login/register page
    │   │   ├── EsewaSuccess.jsx        # eSewa success result page
    │   │   ├── EsewaFailure.jsx        # eSewa failure result page
    │   │   ├── ForgetPasswordPage.jsx  # Forgot password form
    │   │   ├── HomePage.jsx            # Public landing page
    │   │   ├── NotFoundPage.jsx        # 404 page
    │   │   └── ResetPasswordPage.jsx   # Password reset with strength UI
    │   │
    │   ├── routers/
    │   │   └── ProtectedRoutes.jsx     # Role-based route guard
    │   │
    │   ├── App.jsx                     # Root router component
    │   └── main.jsx                    # React DOM entry point
    │
    ├── test/                           # Vitest component tests
    ├── .env                            # Frontend environment variables
    ├── vite.config.js                  # Vite config
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

| Software | Minimum Version | Recommended |
|---|---|---|
| **Node.js** | 16.x | 18.x LTS |
| **npm** | 7.x | 9.x |
| **MongoDB** | 5.x | 7.x |
| **Git** | 2.x | Latest |

### Step 1: Clone the Repositories

```bash
# Clone both repositories into a shared parent directory
mkdir MotoFix && cd MotoFix

git clone https://github.com/dipen-dra/MotoFix-backend.git
git clone https://github.com/dipen-dra/MotoFix-Frontend.git
```

### Step 2: Backend Setup

```bash
cd MotoFix-backend

# Install all dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your actual credentials (see Environment Variables section)
nano .env
```

### Step 3: Frontend Setup

```bash
cd ../MotoFix-Frontend

# Install all dependencies
npm install

# Create frontend environment file
echo "VITE_API_BASE_URL=http://localhost:5050/api/auth" > .env
```

### Step 4: Seed the Database

```bash
cd ../MotoFix-backend

# Seed the database with admin account, default rider, and sample services
node seeder.js
```

This creates:
- Admin account: `dipendrajr999@gmail.com` / `admin123`
- Sample services (Engine Tune-Up, Oil Change, Tire Repair, etc.)
- Default workshop profile

### Step 5: Run the Applications

Open **two terminal windows**:

**Terminal 1 — Backend:**
```bash
cd MotoFix-backend
npm run dev
# Server starts on http://localhost:5050
```

**Terminal 2 — Frontend:**
```bash
cd MotoFix-Frontend
npm run dev
# App starts on http://localhost:5173
```

### Step 6: Verify Setup

Open `http://localhost:5173` in your browser. You should see the MotoFix landing page.

```
✅ Homepage loads with dynamic services from backend
✅ Register a new account
✅ Login redirects to user dashboard
✅ Admin login (seeded credentials) redirects to admin dashboard
✅ Gemini AI chatbot visible in bottom-right corner
```

---

## ⚙️ Environment Variables

### Backend (`MotoFix-backend/.env`)

```env
# ── Server ────────────────────────────────────────────────────────────────────
PORT=5050
NODE_ENV=development

# ── Database ──────────────────────────────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/motofixdb
# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/motofixdb

# ── Authentication ────────────────────────────────────────────────────────────
SECRET=your_super_secret_jwt_key_change_this_in_production

# ── Admin Seed Account ────────────────────────────────────────────────────────
ADMIN_EMAIL=admin@motofix.com
ADMIN_PASSWORD=Admin@MotoFix1

# ── Email (Gmail SMTP) ────────────────────────────────────────────────────────
# Enable "Less secure app access" OR use App Password
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_gmail_app_password_16chars

# ── Client (for email links) ──────────────────────────────────────────────────
CLIENT_URL=http://localhost:5173

# ── Payment Gateways ──────────────────────────────────────────────────────────
# Khalti (use test key for development)
KHALTI_SECRET_KEY=test_secret_key_3f78fb6364ef4bd1b5fc670ce33a06f5

# eSewa credentials are hardcoded in esewaController.js for sandbox testing
# Change ESEWA_SCD and ESEWA_SECRET for production

# ── AI Integration ────────────────────────────────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
```

### Frontend (`MotoFix-Frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:5050/api/auth
```

> ⚠️ **NEVER commit `.env` files to version control.** Both repos have `.env` in `.gitignore`.

---

## 🧪 Running Tests

### Backend Tests (Jest + Supertest)

```bash
cd MotoFix-backend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.js
```

**Test Coverage Areas:**
- User registration (valid, duplicate email, weak password)
- User login (correct/incorrect credentials)
- Booking creation & cancellation
- Admin-only endpoint access control
- Payment amount validation
- Password reset token flow

### Frontend Tests (Vitest + Testing Library)

```bash
cd MotoFix-Frontend

# Run all tests
npm test

# Run with UI
npm run test:ui

# Run in watch mode
npm test -- --watch
```

---

## 🌐 Deployment Guide

### Production Checklist

Before deploying to production, ensure:

```
□ NODE_ENV=production set in environment
□ Strong, randomly generated SECRET (64+ chars)
□ MongoDB Atlas connection string (not local)
□ Real SMTP credentials (not test)
□ eSewa merchant code and secret updated for production
□ Khalti production keys configured
□ CLIENT_URL set to your production domain
□ HTTPS configured (Helmet will enforce secure cookies)
□ Reverse proxy (Nginx) configured
□ PM2 process manager for backend
□ Vite production build for frontend (npm run build)
```

### Environment-Aware Security Changes

When `NODE_ENV=production`:
- Cookies get `secure: true` (HTTPS only)
- Cookies get `sameSite: 'none'` (cross-origin safe)
- Error stack traces are hidden from API responses
- Log files stored in `/logs/` with 90-day rotation

### Quick Deploy (VPS/Droplet)

```bash
# Backend
cd MotoFix-backend
npm install --production
pm2 start index.js --name motofix-api
pm2 save

# Frontend
cd MotoFix-Frontend
npm run build
# Serve dist/ folder with Nginx
```

---

## 🛡️ Security Hardening Summary

### Implementation Details

| Category | Measure | File |
|---|---|---|
| **Headers** | Helmet with crossOriginResourcePolicy | `index.js` |
| **CORS** | Strict origin whitelist | `index.js` |
| **Rate Limiting** | Global 200/15min, Auth 15/15min | `index.js` |
| **Body Security** | XSS sanitizer + HPP middleware | `index.js` |
| **Cookie Security** | HttpOnly, Secure, SameSite | `userController.js` |
| **Auth Middleware** | Dual-mode (cookie + Bearer) | `authorizedUser.js` |
| **File Upload** | Null byte + double extension filter | `upload.js`, `fileupload.js` |
| **Payment Integrity** | Server-side amount validation | `bookingController.js`, `esewaController.js` |
| **Password Policy** | 8+ chars, complexity, history, name-ban | `userController.js` |
| **Audit Logging** | 3-tier Winston daily-rotating logs | `logger.js`, `requestLogger.js` |
| **Frontend XSS** | DOMPurify on chatbot output | `GeminiChatbot.jsx`, `Chatbot.jsx` |
| **Credentials** | withCredentials: true on all Axios | `api.js`, `chatbotApi.js`, `reviewService.js` |
| **Session Logout** | Cookie clear on logout | `userRoute.js` |
| **IDOR Prevention** | Always scope DB queries to req.user | `bookingController.js` |
| **Log Sanitization** | Auto-redact password/token fields | `logger.js` |

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Commit** your changes: `git commit -m 'feat: add some feature'`
4. **Push** to the branch: `git push origin feature/your-feature-name`
5. **Open** a Pull Request

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     A new feature
fix:      A bug fix
sec:      Security improvement
style:    UI/styling changes
refactor: Code refactoring
test:     Adding or modifying tests
docs:     Documentation changes
chore:    Maintenance tasks
```

### Code Style

- **JavaScript**: ES6+ module syntax, async/await
- **React**: Functional components with hooks
- **CSS**: TailwindCSS utility classes
- **Error Handling**: Always use try/catch in async controllers
- **Security**: Never trust client-provided amounts or IDs

---

## 📊 Performance Considerations

| Feature | Strategy |
|---|---|
| **Booking Pagination** | `skip()` + `limit()` on MongoDB queries |
| **Message History** | Last 100 messages per room on join |
| **File Uploads** | 5MB limit enforced server-side |
| **AI Responses** | maxOutputTokens: 500 cap on Gemini |
| **Static Files** | Served directly via express.static |
| **Analytics** | MongoDB aggregation pipelines |
| **Real-time** | Socket.IO rooms (not broadcasting to all) |

---

## 📄 License

This project is licensed under the **ISC License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Dipendra** — Full-Stack Developer

- GitHub Backend: [@dipen-dra/MotoFix-backend](https://github.com/dipen-dra/MotoFix-backend)
- GitHub Frontend: [@dipen-dra/MotoFix-Frontend](https://github.com/dipen-dra/MotoFix-Frontend)

---

<div align="center">

**Built with ❤️ using the MERN Stack**

*MotoFix — Keeping your ride running smooth, one service at a time.*

[![Stars](https://img.shields.io/github/stars/dipen-dra/MotoFix-backend?style=social)](https://github.com/dipen-dra/MotoFix-backend)

</div>
