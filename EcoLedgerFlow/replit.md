# EcoLedger - Trustworthy Carbon, Transparent Future

## Overview

EcoLedger is a web-based carbon credit marketplace connecting NGOs that plant mangroves with buyers seeking verified ca rbon credits. The platform provides transparency through a simulated blockchain ledger system, allowing NGOs to record plantation activities, earn carbon credits through verification, and enabling buyers to purchase these credits. Built as a hackathon prototype, it focuses on demonstrating the core functionality of a carbon credit marketplace with clear user flows for different stakeholder types.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with React and TypeScript, using Vite as the build tool. The UI leverages shadcn/ui components with Radix UI primitives and Tailwind CSS for styling. The application follows a role-based dashboard pattern with distinct interfaces for NGOs, buyers, and administrators.

**Key architectural decisions:**
- **Component Library**: Uses shadcn/ui for consistent, accessible UI components
- **State Management**: React Query (TanStack Query) for server state management with local React state for UI interactions
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture  
The server uses Express.js with TypeScript, providing a RESTful API architecture. The system implements role-based access control with simple header-based authentication for demo purposes.

**Key architectural decisions:**
- **API Design**: RESTful endpoints organized by resource type (plantations, credits, transactions)
- **Authentication**: Simplified header-based system suitable for prototype demonstration
- **Data Validation**: Shared Zod schemas between frontend and backend for consistent validation
- **Error Handling**: Centralized error middleware with structured error responses

### Data Storage Solutions
The application is configured to use PostgreSQL with Drizzle ORM but currently implements an in-memory storage system for rapid prototyping. The schema supports full relational data modeling for production deployment.

**Key architectural decisions:**
- **ORM Choice**: Drizzle ORM for type-safe database interactions and automatic migration generation
- **Storage Strategy**: In-memory storage for demo with PostgreSQL schema ready for production
- **Data Modeling**: Relational design supporting users, plantations, credits, and transaction history

### Authentication and Authorization
The system implements a simplified role-based access control system with three user types: NGOs, buyers, and administrators. Each role has specific permissions and dashboard access.

**Key architectural decisions:**
- **Role System**: Three distinct roles with specific capabilities and UI access
- **Session Management**: Client-side session storage for demo purposes
- **API Security**: Header-based user identification for API requests

### Carbon Credit Logic
The platform implements a simplified carbon credit calculation system where mangrove plantings are converted to carbon credits at a 100:1 ratio. Credits must be verified by administrators before becoming available for purchase.

**Key architectural decisions:**
- **Credit Calculation**: Simple rule-based system (100 mangroves = 1 credit)
- **Verification Workflow**: Admin approval required before credits become tradeable
- **Ownership Tracking**: Full audit trail of credit ownership and transfers

## External Dependencies

### Database and ORM
- **Drizzle ORM**: Type-safe database toolkit for PostgreSQL interactions
- **PostgreSQL**: Primary database (configured but using in-memory storage for demo)
- **Neon Database**: Cloud PostgreSQL service integration

### UI and Styling
- **Radix UI**: Primitive components for accessibility and customization
- **Tailwind CSS**: Utility-first CSS framework for styling
- **shadcn/ui**: Pre-built component library built on Radix UI and Tailwind

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across frontend and backend
- **React Query**: Server state management and caching
- **React Hook Form**: Form handling and validation
- **Zod**: Runtime type validation and schema definition

### Deployment and Runtime
- **Express.js**: Web server framework for API endpoints
- **Node.js**: Server-side JavaScript runtime
- **Replit**: Development and hosting platform with integrated tooling