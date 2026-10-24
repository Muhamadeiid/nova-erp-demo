# Nova ERP: HR Module (Demo)

An HR and workforce management web app: employee records, org chart, attendance, leave and overtime requests with a multi-step approval flow.

This repository is a **public demo build** of an internal HR system I developed. Company names, branding and all real data have been removed. The live demo runs entirely in the browser on fictional sample data.

## Live demo

**https://nova-erp-demo.vercel.app**

Sign in with `admin@nova-demo.dev` / `demo1234` (or click the demo box on the login page). Data resets when you reload.

## What's inside

- **HR dashboard**: headcount, today's attendance, weekly attendance chart, pending leave and overtime
- **Employee list**: search, filters by department and location, profile drawer, add and edit employees
- **Org chart**: reporting lines with direct-manager assignment
- **Leave requests**: bilingual (English/Arabic) request form, approval chain (direct manager → HR → general manager), printable and Word export
- **Overtime requests**: same approval flow for overtime hours
- **Attendance**: daily punch records, late and absence tracking, summaries per employee
- **Attendance calendar**: approved leave on a monthly view
- **Notifications** with unread counts

## Tech stack

- React 19 + Vite
- Redux Toolkit
- React Router
- Tailwind CSS
- Recharts
- docx / ExcelJS / jsPDF for document exports

In production the app talks to a Laravel REST API with token authentication and MySQL. For this demo, `VITE_DEMO_MODE=true` replaces the API with an in-browser mock layer (`src/demo/`) that serves the same endpoints from sample data.

## Run locally

```bash
npm install
echo "VITE_DEMO_MODE=true" > .env.development.local
npm run dev
```

```bash
npm run build   # production build
npm run lint    # ESLint
```
