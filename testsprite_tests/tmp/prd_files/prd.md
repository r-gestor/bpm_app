# Product Requirements Document (PRD) - BPM Academy

## 1. Project Overview
BPM Academy (Manipulador Capacitado) is a digital platform designed to provide online training and health-related services, primarily focused on Food Handling (Manipulación de Alimentos) and sanitation compliance for businesses in Colombia. The platform integrates educational content, automated certification, and AI-driven document generation.

## 2. Target Audience
- **Individuals**: Seeking food handling certification.
- **Business Owners (SMEs)**: Needing to comply with health regulations (Sanitation Plans).
- **Inspectors/Auditors**: Verifying the validity of certificates and plans.
- **Administrators**: Managing sales, students, and content.

## 3. Key Features

### 3.1 Online Education & Certification
- **Course Library**: Modules with video content and PDF materials.
- **Student Progress**: Tracking of watched videos and lesson completion.
- **Exam System**:
    - Randomized questions from a database.
    - Automated scoring and pass/fail logic (80% minimum).
    - Detailed feedback on correct/incorrect answers.
- **Digital Certificates**:
    - Automated PDF generation upon passing.
    - Secure verification via unique codes and QR.
    - Expiration management (yearly renewal).

### 3.2 AI Sanitation Plan Service
- **Smart Survey**: Interactive form to collect technical data about establishments (spaces, equipment, products).
- **AI Content Generation**: Uses Claude 3.5 Sonnet to generate technical sections (L+D, Pests, Waste, Water, etc.) based on Resolution 2674/2013.
- **Premium PDF Generation**:
    - Dynamic headers with company logo and NIT.
    - Footer with page numbering and QR verification.
    - Digital signature integration for professionals and legal representatives.
    - **Unified Follow-up Format**: Appending 31-day monitoring tables in landscape orientation for manual record-keeping.
- **Retrieval-Augmented Generation (RAG)**: Uses Supabase Vector search to inject technical knowledge into AI prompts.

### 3.3 Verification System
- **Public Portal**: `/verify/[code]` allows anyone to scan a document QR and see its validity.
- **Universal Search**: Handles both student certificates and business sanitation plans.
- **Detailed Logs**: Tracking verification attempts (IP, User Agent, Date).

### 3.4 Management & Operations
- **E-commerce**: Product listing and checkout (Course vs. AI Service).
- **Admin Dashboard**:
    - Order management.
    - Enrollment and student tracking.
    - Content management (videos, questions).
- **Payment Integration**: Support for digital payments (Wompi).

## 4. Technical Architecture

### 4.1 Frontend
- **Framework**: Next.js 15 (App Router).
- **Styling**: Vanilla CSS and Tailwind CSS (responsive and premium aesthetics).
- **Icons**: Lucide React.
- **State Management**: React Hooks.

### 4.2 Backend & Infrastructure
- **BaaS**: Supabase (PostgreSQL, Authentication, Edge Functions, Storage).
- **ORM**: Prisma (for local development/schema management).
- **AI**: Anthropic Claude API (Sonnet 3.5).
- **PDF Generation**: Puppeteer (server-side generation).
- **Utilities**: `qrcode` (conversion data URLs), `marked` (markdown to HTML).

### 4.3 Database Schema (Key Tables)
- `users`: Authentication and roles (BUYER, STUDENT, ADMIN, PROFESSIONAL).
- `products`: Courses and AI services.
- `enrollments`: Mapping users to courses.
- `exam_attempts`: History of scores and pass status.
- `sanitation_plans`: Metadata and generated content for business plans.
- `certificates`: Issued certifications.
- `payments`: Transaction records.

## 5. Security & Verification
- **Verification Hash**: Unique SHA-256 (or similar) hashes for document integrity.
- **Secure Storage**: PDF files stored in private/public buckets with controlled access.
- **Role-Based Access Control (RBAC)**: Ensuring students only see their courses and admins have full control.

## 6. Success Metrics
- **Performance**: PDF generation under 10 seconds.
- **Accuracy**: AI content strictly follows Colombian sanitary regulations.
- **Reliability**: 100% readability of QR codes in printed documents.
- **User Experience**: 90%+ course completion rate due to intuitive interface.
