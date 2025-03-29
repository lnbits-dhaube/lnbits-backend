# LNBits Backend

This is the backend for the LNBits project, which provides APIs for managing users, wallets, roles, and payments.

## Prerequisites

Before running the project, ensure you have the following installed:

- Node.js (v16 or higher)
- npm or yarn
- MySQL database

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/lnbits-dhaube/lnbits-backend.git
   cd lnbits-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure the `.env` file:

   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Update the environment variables in the `.env` file:
     - `BASE_API_URL`: Base URL for external API
     - `DATABASE_URL`: MySQL connection string
     - `JWT_SECRET`: Secret for JWT tokens
     - `JWT_REFRESH_SECRET`: Secret for refresh JWT tokens

4. Set up the database:

   - Generate the migration files after updating the schema:
     ```bash
     npx drizzle-kit generate
     ```
   - Apply the migrations to the database:
     ```bash
     npx drizzle-kit migrate
     ```

5. Start the server:

   ```bash
   npm start
   ```

   The server will run on the port specified in the `.env` file (default: `3000`).

## Project Structure

- **`src/db`**: Contains database schema and configuration.
- **`src/middleware`**: Middleware for authentication and authorization.
- **`src/routes`**: API route handlers.
- **`src/utils`**: Utility functions for various operations.
- **`drizzle.config.ts`**: Configuration for Drizzle ORM.

## API Endpoints

The backend provides the following API endpoints:

- **Authentication**:

  - `POST /api/login`: Login for `ADMIN` users.
  - `POST /api/admin-login`: Login for `SUPER_ADMIN` users.
  - `POST /api/refresh-token`: Refresh access tokens.

- **Users**:

  - `POST /api/users`: Create a new user (SUPER_ADMIN only).
  - `GET /api/users`: Get all users (SUPER_ADMIN only).
  - `GET /api/users/:userId`: Get details of a specific user (SUPER_ADMIN only).
  - `GET /api/my-user-info`: Get details of the authenticated user (ADMIN only).

- **Payments**:
  - `GET /api/wallet/:userId`: Get wallet balance for a user (SUPER_ADMIN only).
  - `GET /api/payment-history/:userId`: Get payment history for a user (SUPER_ADMIN only).
  - `GET /api/my-payment-history`: Get payment history for the authenticated user (ADMIN only).

## Notes for Contributors

- After making changes to the database schema (`src/db/schema.ts`), always run:

  ```bash
  npx drizzle-kit generate
  npx drizzle-kit migrate
  ```

  This ensures the database is in sync with the updated schema.

- Follow the existing project structure and coding conventions.

- Ensure all new features are covered by appropriate tests.

- Use environment variables for sensitive data and avoid hardcoding them in the codebase.

## Troubleshooting

- **Database Connection Issues**:

  - Ensure the `DATABASE_URL` in the `.env` file is correct.
  - Verify that the MySQL server is running and accessible.

- **JWT Errors**:

  - Check that `JWT_SECRET` and `JWT_REFRESH_SECRET` are set correctly in the `.env` file.

- **CORS Issues**:
  - Update the `origin` array in `index.ts` to include the allowed frontend URLs.

## License

This project is licensed under the MIT License.
