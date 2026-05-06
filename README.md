# Team Task Manager

A full-stack web application with role-based access control (Admin and Member).

## Tech Stack
*   **Frontend**: React 18, Vite, Tailwind CSS, React Query, React Router, React Hook Form
*   **Backend**: Node.js, Express.js, Prisma ORM, PostgreSQL, JWT Authentication

## Prerequisites
*   Node.js (v18+)
*   PostgreSQL running locally or via a cloud provider (e.g., Supabase, Neon)

## Setup Instructions

### 1. Database Configuration
1. Open `backend/.env` and update the `DATABASE_URL` with your actual PostgreSQL connection string.
   *Example:* `DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/team_task_manager?schema=public"`

### 2. Backend Setup
Open a terminal and run the following commands:
```bash
cd backend
# Install dependencies (already done if you've been following along)
npm install

# Push the schema to your database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Start the development server
npm run dev
```
The backend will run on `http://localhost:5000`.

### 3. Frontend Setup
Open a new terminal and run:
```bash
cd frontend
# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend will run on `http://localhost:5173`.

## Deployment
*   **Backend**: A `railway.json` is included for easy deployment to Railway. Ensure you add your environment variables (like `DATABASE_URL` and `JWT_SECRET`) in your Railway project settings.
*   **Frontend**: A `vercel.json` is included. You can easily deploy the frontend to Vercel. Make sure to set `VITE_API_URL` to your Railway backend URL in the Vercel project settings.

## Features
*   **Authentication**: JWT-based login, signup, and token refresh.
*   **Role-Based Access**: Admins can create projects and tasks, assign members, and manage users. Members can view their assigned tasks and update statuses.
*   **Dashboard**: Overview of tasks, progress, and recent activity.
*   **Projects & Tasks**: Kanban-style task management linked to specific projects.
