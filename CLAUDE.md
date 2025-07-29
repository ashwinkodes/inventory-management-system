# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an outdoor gear rental management system for clubs, built as a full-stack TypeScript application with React frontend and Express backend. The system allows club members to browse and request outdoor gear (backpacks, sleeping bags, climbing equipment, etc.) while providing administrators with management capabilities.

## Architecture

### Monorepo Structure
- **Root level**: Contains workspace configuration with `concurrently` for running both services
- **Client/**: React + TypeScript frontend using Vite, TailwindCSS, and React Query
- **Server/**: Express + TypeScript backend with Prisma ORM and PostgreSQL

### Backend (Server/)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with role-based access control (ADMIN/MEMBER)
- **Security**: Helmet, CORS, rate limiting, bcrypt for password hashing
- **File uploads**: Multer support for gear images
- **Architecture**: RESTful API with route-based organization (`/api/auth`, `/api/gear`, `/api/requests`, `/api/users`)

### Frontend (Client/)
- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS with PostCSS
- **State Management**: React Query (@tanstack/react-query) for server state
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Calendar**: FullCalendar for scheduling
- **Notifications**: React Hot Toast

### Database Schema (Prisma)
Key models and relationships:
- **User**: Members and admins with multi-club support (`clubIds` array)
- **GearItem**: Equipment inventory with categories, conditions, and club ownership
- **Request**: Rental requests with date ranges and approval workflow
- **RequestItem**: Junction table for gear items within requests with check-in/out tracking

## Development Commands

### Root Level
```bash
npm run dev          # Start both client and server in development
npm run client:dev   # Start only the frontend (Vite dev server on :5173)
npm run server:dev   # Start only the backend (Express server on :3001)
npm run build        # Build the client for production
npm start           # Start production server
```

### Client (cd Client/)
```bash
npm run dev         # Vite development server
npm run build       # TypeScript compilation + Vite build
npm run lint        # ESLint with TypeScript rules
npm run preview     # Preview production build
```

### Server (cd Server/)
```bash
npm run dev         # Development server with tsx watch
npm run build       # TypeScript compilation to dist/
npm start          # Run compiled server from dist/
npm run db:generate # Generate Prisma client
npm run db:push     # Push schema changes to database
npm run db:studio   # Open Prisma Studio
npm run db:seed     # Run database seeding script
```

## Key Technical Details

### Authentication Flow
- **Session-based authentication** using database-stored sessions (not JWT)
- HTTP-only cookies for secure session management
- Admin approval required for new user registrations  
- Role-based access with ADMIN and MEMBER roles
- Multi-club support through `clubIds` array on users

### Default Test Accounts
After running `npm run db:seed`, you can use these accounts for testing:

**Admin Account:**
- Email: `admin@example.com`
- Password: `admin123`
- Role: ADMIN (can manage gear, approve users)

**Member Account:**
- Email: `member@example.com`  
- Password: `member123`
- Role: MEMBER (can browse and request gear)

**Pending Account (for testing approvals):**
- Email: `pending@example.com`
- Password: `pending123`
- Status: Pending admin approval

### Database Relationships
- Users can belong to multiple clubs (`clubIds: String[]`)
- Gear items belong to specific clubs (`clubId: String`)
- Requests can contain multiple gear items through `RequestItem` junction table
- Complex status tracking for both requests and individual items

### Environment Configuration
- Server requires `DATABASE_URL`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`
- Frontend connects to backend at localhost:3001 in development

### Frontend State Management
- Uses React Query for server state caching and synchronization
- Form validation with Zod schemas
- Component-based architecture with TypeScript interfaces

## Code Conventions

- **TypeScript**: Strict typing throughout both frontend and backend
- **Prisma**: Database-first schema with generated types
- **ESLint**: Configured for React and TypeScript with strict rules
- **File Structure**: Route-based organization for backend, component-based for frontend
- **Naming**: PascalCase for components, camelCase for functions/variables, SCREAMING_SNAKE_CASE for enums