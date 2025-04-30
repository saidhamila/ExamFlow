# ExamFlow - Exam Scheduling System

## Description

ExamFlow is a web application designed to manage and schedule academic examinations. It provides administrators with tools to create and manage exams, assign invigilators (users with specific roles), manage departments, and view relevant statistics and reports. Regular users can view schedules and manage their profiles.

## Features

*   **Admin Dashboard:** Overview of upcoming exams, invigilator stats, and recent activity.
*   **Exam Management:** Create, read, update, and delete exam schedules, including details like subject, date, time, and department.
*   **User Management:** Add, update, and delete users with different roles (e.g., ADMIN, ENSEIGNANT).
*   **Invigilator Assignment:** Assign users (invigilators) to specific exams and rooms (basic implementation).
*   **Room Management:** (Implicit) Rooms are assigned to exams.
*   **Department Management:** (Implicit) Exams and users are associated with departments.
*   **Reporting:** View basic reports like exam distribution by department, invigilator workload (assignment count), and room utilization.
*   **Notifications:** View system notifications (e.g., upcoming/finished exams).
*   **Profile Management:** Users can view their profile and change their password.
*   **Authentication:** Secure login system with role-based access control.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (v15+)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI:** [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Database:** [PostgreSQL](https://www.postgresql.org/) (Compatible with NeonDB)
*   **Authentication:** Cookie-based sessions, [bcryptjs](https://www.npmjs.com/package/bcryptjs) for password hashing
*   **Package Manager:** [pnpm](https://pnpm.io/)

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   pnpm package manager (`npm install -g pnpm`)
*   PostgreSQL database (or a NeonDB account)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/saidhamila/ExamFlow.git
    cd ExamFlow
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    *   Create a `.env` file in the root directory.
    *   Add your PostgreSQL database connection string:
        ```env
        DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
        ```
        (Replace `USER`, `PASSWORD`, `HOST`, `PORT`, `DATABASE` with your actual database credentials. If using NeonDB, get the connection string from your Neon dashboard.)

4.  **Generate Prisma Client:**
    ```bash
    pnpm prisma generate
    ```

5.  **Synchronize database schema:**
    *   This command will create/update the database tables based on `prisma/schema.prisma`. **Warning:** This is suitable for development; for production, use `prisma migrate deploy`.
    ```bash
    pnpm prisma db push
    ```

6.  **Seed the database (optional but recommended):**
    *   This creates the default admin user (`testadmin@valpha.dev` / `password`).
    ```bash
    pnpm prisma db seed
    ```

7.  **Run the development server:**
    ```bash
    pnpm run dev
    ```

8.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

*   **Admin Login:**
    *   Email: `testadmin@valpha.dev`
    *   Password: `password` (as set in `prisma/seed.ts`)
*   Navigate through the Admin Panel to manage exams, users (invigilators), and view reports.
*   Use the profile page to change your password.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is currently unlicensed. Choose an appropriate open-source license if desired (e.g., MIT, Apache 2.0).