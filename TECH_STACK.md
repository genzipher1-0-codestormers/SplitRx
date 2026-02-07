# 🛠️ Tech Stack & Architecture

Welcome to the technical overview of **SplitRx**. This document is designed to be readable by everyone—from non-technical stakeholders to experienced engineers.

---

## 🟢 For Everyone (Beginner Friendly)

Think of this application like a **modern, secure pharmacy**.

### 1. The Storefront (Frontend)
**Technology:** Next.js & React
This is what you see and interact with. Just like a modern store has a clean layout, shelves, and a checkout counter, our specific "storefront" is built to be fast, responsive on mobile phones, and easy to use.
-   **What it does:** Shows you the dashboard, lets doctors write prescriptions, and allows pharmacists to scan codes.

### 2. The Brain (Backend)
**Technology:** Node.js & Express
This is the manager in the back office. When you click "Submit Prescription," the Storefront talks to the Brain.
-   **What it does:** Checks if you are allowed to do that action, validates that the data is correct, and decides where to file the information.

### 3. The Filling Cabinet (Database)
**Technology:** PostgreSQL
This is where all the records are kept safe. It's not just a stack of papers; it's a high-speed, organized vault.
-   **What it does:** Stores user accounts, prescription details, and the secure audit logs that prove no one tampered with the data.

### 4. The Shipping Container (Infrastructure)
**Technology:** Docker
Imagine being able to pick up the entire pharmacy—building, shelves, medicine, and staff—and move it to any city in the world instantly. That's what Docker does.
-   **What it does:** Packages the whole application so it runs exactly the same way on a developer's laptop as it does on the cloud servers.

---

## 🔴 For Developers (Technical Deep Dive)

### 🖥️ Frontend (Client-Side)
Building a performant, type-safe, and beautiful UI.

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16** (App Router) | React framework for server-side rendering and static generation. |
| **Language** | **TypeScript** | Ensures type safety and reduces runtime errors. |
| **Styling** | **Tailwind CSS v4** | Utility-first CSS framework for rapid UI development. |
| **State/Icons** | **Lucide React** | Lightweight, consistent icon library. |
| **Notifications** | **React Hot Toast** | Beautiful, animated toast notifications. |
| **HTTP Client** | **Axios** | internal API consumption. |
| **QR Codes** | **QRCode.react** / **@zxing** | Generating and scanning verification codes. |

### ⚙️ Backend (Server-Side)
A robust, secure REST API handling business logic and data integrity.

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | **Node.js** | JavaScript runtime built on Chrome's V8 engine. |
| **Framework** | **Express.js** | Fast, unopinionated, minimalist web framework. |
| **Database Driver** | **node-postgres (pg)** | Non-blocking PostgreSQL client for Node.js. |
| **Validation** | **Zod** | TypeScript-first schema declaration and validation library. |
| **Security** | **Helmet** | Helps secure Express apps by setting various HTTP headers. |
| **Auth** | **JWT & Bcrypt** | JSON Web Tokens for stateless auth & Bcrypt for password hashing. |
| **Logging** | **Morgan** | HTTP request logger middleware. |

### 🗄️ Database & Storage
| Category | Technology | Description |
| :--- | :--- | :--- |
| **RDBMS** | **PostgreSQL 15** | Advanced, enterprise-class open-source relational database. |
| **Schema** | **SQL** | Raw SQL scripts (`init.sql`) used for schema definition and rigorous data integrity. |

### 🚀 DevOps & Infrastructure
| Category | Technology | Description |
| :--- | :--- | :--- |
| **Containerization** | **Docker** | Application containerization for consistent environments. |
| **Orchestration** | **Docker Compose** | Multi-container Docker applications definition. |
| **CI/CD** | **GitHub Actions** (Planned) | Automated testing and deployment pipelines. |
