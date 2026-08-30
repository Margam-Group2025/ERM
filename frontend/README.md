# React + Vite

<!-- This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project. -->

# Employee Report & Performance Management System (ERM)

A centralized MERN-stack web application that replaces scattered email-based
work reporting with a single system for daily, weekly, and monthly employee
reports — built with role-based access control and department-specific,
dynamically configurable report forms.

## Why this project

Most internal reporting tools hardcode a single report format for every
team. In reality, a Development team's daily report looks nothing like a
Sales team's — different fields, different structure. This system solves
that with a **schema-driven Report Template Builder**: an Admin defines a
department's report fields at runtime (text, number, date, select,
checkbox, textarea), and the employee's report form renders dynamically
from that schema — no hardcoded forms, no code changes needed to onboard a
new department.

## Features

- **Role-based access control** — Admin, Team Lead, and Employee roles,
  each with strictly scoped permissions enforced on the backend
- **Dynamic report templates** — Admin builds a custom form per department
  and report type (daily / weekly / monthly); employees fill whatever
  form is currently active for their department
- **Report review workflow** — Team Leads approve, reject, or send back
  reports from their own department only (a Development lead can never see
  Sales reports, and vice versa)
- **Excel export** — Admin can export any filtered set of reports to
  `.xlsx`; Team Leads can export their own department's reports. Columns
  are generated dynamically from whatever fields exist in the filtered data
- **Task management** — Team Leads assign tasks with priority and
  deadlines; employees track and update task status
- **Team management** — Admin can view every department's roster and
  change any employee's role (e.g. hand off Team Lead to someone else)
  directly from the UI
- **Protected routes** — the frontend redirects unauthenticated or
  wrong-role users automatically; the backend independently re-verifies
  every request via JWT + role middleware

## Tech stack

**Frontend:** React (Vite), Tailwind CSS, React Router, Framer Motion,
Lucide React

**Backend:** Node.js, Express.js

**Database:** MongoDB Atlas, Mongoose

**Auth:** JWT, bcryptjs

**Reporting:** ExcelJS

## Project structure

```
├── backend/
│   ├── config/         # MongoDB connection
│   ├── models/         # Mongoose schemas
│   ├── controllers/    # Route logic
│   ├── routes/         # Express routers
│   ├── middleware/     # Auth (JWT) + role authorization
│   └── server.js
└── frontend/
    └── src/
        ├── pages/       # Route-level components
        ├── components/  # Shared components (ProtectedRoute, etc.)
        └── layout/      # AdminLayout (sidebar navigation)
```

## Getting started

### Prerequisites

- Node.js (LTS)
- A MongoDB Atlas cluster (free tier works)

### Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_random_secret_string
PORT=5000
```

```bash
npm run start
```

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` (frontend) and
`http://localhost:5000` (backend API).

### First Admin account

Since `/api/auth/register` requires an existing Admin token, the very
first Admin account has to be created once — either by temporarily
removing the route's auth guard to self-register, or by inserting a user
document directly in MongoDB Atlas with a bcrypt-hashed password. Every
subsequent user is created normally through the Admin UI.

## Roles at a glance

| Role | Can do |
|---|---|
| **Admin** | Manage departments, teams, users, report templates; view and export all reports; reassign roles |
| **Team Lead** | View/review reports for their own department only; assign tasks; export their department's reports |
| **Employee** | Fill and submit reports based on their department's active template; track assigned tasks |

## Status

Core system complete: auth, RBAC, dynamic templates, report submission,
review workflow, Excel export, and task management are all implemented
end-to-end across backend and frontend. Manual performance scoring
(Section 10 of the original spec) is the one remaining planned feature.