# Bidora Setup Instructions

This guide provides step-by-by instructions for setting up the Bidora full-stack application locally.

## Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Docker](https://www.docker.com/) (Optional, but recommended for running the database)

## 1. Clone the Repository (If applicable)
\`\`\`bash
git clone <your-repository-url>
cd Bidora
\`\`\`

## 2. Environment Variables

We use a monorepo setup (frontend and backend in separate directories, or in this example, setup independently).
Currently, the codebase is structured with `frontend/` and `backend/`.

1. Copy the `.env.example` file to the root or respective directories:
   \`\`\`bash
   cp .env.example frontend/.env.local
   cp .env.example backend/.env
   \`\`\`
2. Update the values in `.env` with your local database credentials, JWT secrets, and any mock API keys.

## 3. Database Setup

You can run PostgreSQL locally or via Docker.

**Using Docker:**
\`\`\`bash
docker run --name bidora-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=bidora -p 5432:5432 -d postgres
\`\`\`

**Using Prisma:**
The backend uses Prisma as an ORM. Navigate to the backend directory and run the migrations:
\`\`\`bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
\`\`\`

## 4. Backend Setup

1. Navigate to the backend directory:
   \`\`\`bash
   cd backend
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the development server (runs with nodemon or equivalent dev script):
   \`\`\`bash
   npm run dev
   \`\`\`
   The backend should now be running on `http://localhost:5000`.

## 5. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   \`\`\`bash
   cd frontend
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the Next.js development server:
   \`\`\`bash
   npm run dev
   \`\`\`
   The frontend should now be running on `http://localhost:3000`.

## 6. Access the Application

- **Frontend Application:** Open `http://localhost:3000` in your browser.
- **Backend API:** The API is accessible at `http://localhost:5000/api`.

## Running the Complete Stack with Docker Compose (Alternative)

If a `docker-compose.yml` is provided in the root:
\`\`\`bash
docker-compose up --build
\`\`\`
This will spin up the database, backend, and frontend containers automatically.
