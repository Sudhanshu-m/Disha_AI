# ScholarshipAI - AI-Powered Scholarship Matching Platform

## Overview

ScholarshipAI is a web application that uses artificial intelligence to match students with relevant scholarship opportunities. The platform analyzes student profiles including academic performance, field of study, financial need, and extracurricular activities to provide personalized scholarship recommendations with match scores. Students can create detailed profiles, browse matched scholarships, track application deadlines, and receive AI-generated application guidance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API structure with route-based organization
- **Development Setup**: Uses tsx for TypeScript execution in development
- **Build Process**: ESBuild for production bundling
- **Error Handling**: Centralized error handling middleware with structured error responses

### Data Storage
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Strongly typed schema definitions shared between client and server
- **Migration**: Drizzle Kit for database schema management

### Authentication & Authorization
- Currently uses temporary user IDs (authentication system planned but not implemented)
- Session management prepared with connect-pg-simple for PostgreSQL session storage

### AI Integration
- **Provider**: OpenAI GPT-4o for intelligent matching and guidance
- **Scholarship Matching**: AI analyzes student profiles against scholarship requirements to generate match scores (0-100)
- **Application Guidance**: AI provides personalized essay tips, checklists, and improvement suggestions

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-zod**: Integration between Drizzle and Zod for validation

### UI & Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Utility for creating variant-based component APIs

### State & Forms
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Performant forms with easy validation
- **@hookform/resolvers**: Validation resolvers for React Hook Form
- **zod**: TypeScript-first schema validation

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution environment for development
- **esbuild**: Fast bundler for production builds
- **@replit/vite-plugin-***: Replit-specific development tools and error handling

### External Services
- **OpenAI API**: AI-powered scholarship matching and application guidance
- **Neon Database**: Serverless PostgreSQL hosting
- **Unsplash**: Stock photography for UI imagery