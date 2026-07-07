# 🏥 Smart Health Management System

Smart Health is an advanced, role-based healthcare management dashboard prototype designed specifically for primary and community health care facilities (PHCs/CHCs). It features a robust dynamic Role-Based Access Control (RBAC) security system, a local database engine, and built-in accessibility helpers tailored for elderly and rural patient care.

---

## 🔑 Test Accounts & Roster
All roles use the default secure password: `password123`

| Roster Role | Test Email address | Capabilities & Key Interfaces |
| :--- | :--- | :--- |
| **System Admin** | `admin@smarthealth.com` | Operations overview, account registry changes, ward bed occupancy counts, global consultation slots cancel/approve overrides, CMS/About pages editor. |
| **Doctor / Clinician** | `doctor@smarthealth.com` | Roster clock-in/check-out console, active consultation queues, clinical booking approvals/rejections console, duty shift hours publisher. |
| **Pharmacist Staff** | `pharmacist@smarthealth.com` | Medicine inventory registry updates, reorder thresholds & critical expiry notices, patient billing creator, billing history receipts reports. |
| **OPD Patient** | `patient@smarthealth.com` | Custom doctor appointment scheduling requests, live consultations queue tracking, bed vacancy checking, bill payment simulator, and invoice printing/downloading. |

---

## 🏗️ Technical Architecture Highlights

### 🛡️ 1. Dynamic Config-Driven RBAC System
The site's navigation, redirection rules, and dashboard layouts are governed by a configuration matrix defined in `assets/js/layout.js`:
* **`ROLE_NAV_CONFIG`**: Maps roles dynamically to permitted navbar links (`guest`, `patient`, `doctor`, `pharmacist`, `admin`).
* **`ROLE_DASHBOARDS`**: Directs authenticated sessions to their corresponding role dashboards.
* **`NAV_ITEMS`**: Defines the metadata schema for all application pages, decoupling menus rendering from static code.

### 💾 2. Local Database Layer (`assets/js/db.js`)
A mock database wrapper backed by `localStorage` simulates complex transactions, including:
* **`sh_users`**: Stores security records, active credentials, profiles names, and profile photos.
* **`sh_appointments`**: Stores consultation slot details, symptoms, requested dates, and checkup status logs.
* **`sh_doctor_availability`**: Manages clinician shift hours and published bookings schedules.
* **`sh_bills`**: Compiles patient pharmacy items, discount calculations, payment statuses, and invoice ledgers.

### 🔊 3. Senior Care & Indian Accessibility Hub
Designed with special attention for rural and elderly patients:
* **Instant TTS Voice Reader**: Select a language from the **Senior Care & Assist** bar dropdown to immediately trigger audio confirmation using browser `window.speechSynthesis`.
* **Translation Widget Acceleration**: Optimized polling loops trigger Google Translate changes in `15ms` (down from `100ms`).
* **Google Translate Shield**: Dynamic class hooks protect Google Material Icons text labels (`notranslate`) from being corrupted or broken during translations.
* **Responsive Layout Controls**: Easy font sizer scales (`A-`, `A`, `A+`) and high-contrast styling toggles.

---

## 📂 Project Directory Structure

```text
Smart_health/
├── assets/
│   ├── css/
│   │   └── styles.css                   # Core stylesheet (layouts, components, theme variables)
│   └── js/
│       ├── db.js                        # Mock database client and seed registries
│       └── layout.js                    # Layout template injector, RBAC guard, & accessibility systems
├── pages/
│   ├── auth/
│   │   ├── login.html                   # Authenticated secure login portal
│   │   └── register.html                # New patient account constructor
│   ├── dashboard/
│   │   ├── admin.html                   # Admin systems portal
│   │   ├── doctor.html                  # Doctor schedule & waiting list console
│   │   ├── patient.html                 # Patient queue & bills cabinet
│   │   └── pharmacist.html              # Inventory editor & bill constructor
│   ├── about.html                       # General clinic info page
│   ├── bed-availability.html            # Public live ward beds counts
│   ├── contact.html                     # Feedback & inventory issue reports
│   ├── doctor-attendance.html           # Live clinician duty attendance roster
│   ├── doctor-availability.html         # Published specialist appointment calendar
│   ├── medicine-stock.html              # Dynamic pharmaceutical stock levels
│   ├── notifications.html               # Alert messages log
│   ├── patient-flow.html                # Queue sizes and average waiting times
│   ├── profile.html                     # Avatar upload & password settings panel
│   └── services.html                    # Clinical specialties directory
└── index.html                           # Landing page
```

---

## 🚀 How to Run Locally

1. Clone or open the workspace folder.
2. Spin up a local development server:
   ```bash
   python -m http.server 5500
   ```
3. Visit the dashboard inside your web browser:
   ```text
   http://localhost:5500/
   ```

---

> [!NOTE]
> All user information, billing histories, and rosters update instantly and persist inside your browser's local cache. Clearing site cookies or local storage will reset the prototype back to its default seeded test profiles.
