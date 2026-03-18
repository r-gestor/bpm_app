-- 1. Usuarios
CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'BUYER', -- 'ADMIN', 'BUYER', 'STUDENT', 'PROFESSIONAL'
    "phone" TEXT,
    "documentType" TEXT, -- 'CC', 'CE', 'NIT', 'PP'
    "documentNumber" TEXT,
    "registeredBy" UUID REFERENCES "users"("id"),
    "activationToken" TEXT UNIQUE,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 2. Productos
CREATE TABLE "products" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL, -- 'COURSE', 'AI_SERVICE'
    "slug" TEXT UNIQUE NOT NULL,
    "imageUrl" TEXT,
    "active" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 3. Cursos
CREATE TABLE "courses" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "productId" UUID REFERENCES "products"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalLessons" INTEGER DEFAULT 0,
    "passingScore" INTEGER DEFAULT 80,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 4. Videos del Curso
CREATE TABLE "course_videos" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "courseId" UUID REFERENCES "courses"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "duration" INTEGER,
    "order" INTEGER,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 5. Progreso de Video
CREATE TABLE "video_progress" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "studentId" UUID REFERENCES "users"("id") ON DELETE CASCADE,
    "courseId" UUID REFERENCES "courses"("id") ON DELETE CASCADE,
    "videoId" UUID REFERENCES "course_videos"("id") ON DELETE CASCADE,
    "watchedSeconds" INTEGER DEFAULT 0,
    "completed" BOOLEAN DEFAULT false,
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    UNIQUE("studentId", "videoId")
);

-- 6. Inscripciones
CREATE TABLE "enrollments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "buyerId" UUID REFERENCES "users"("id"),
    "studentId" UUID REFERENCES "users"("id"),
    "courseId" UUID REFERENCES "courses"("id"),
    "orderId" TEXT,
    "status" TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED', 'EXPIRED'
    "enrolledAt" TIMESTAMPTZ DEFAULT now()
);

-- 7. Intentos de Examen
CREATE TABLE "exam_attempts" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "studentId" UUID REFERENCES "users"("id"),
    "courseId" UUID REFERENCES "courses"("id"),
    "score" INTEGER DEFAULT 0,
    "passed" BOOLEAN DEFAULT false,
    "status" TEXT NOT NULL, -- 'STARTED', 'COMPLETED'
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "completedAt" TIMESTAMPTZ
);

-- 8. Preguntas
CREATE TABLE "questions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "courseId" UUID REFERENCES "courses"("id") ON DELETE CASCADE,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 9. Respuestas
CREATE TABLE "answers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "questionId" UUID REFERENCES "questions"("id") ON DELETE CASCADE,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN DEFAULT false
);

-- 10. Cupones de Descuento
CREATE TABLE "discount_codes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" TEXT UNIQUE NOT NULL,
    "percentage" INTEGER NOT NULL,
    "active" BOOLEAN DEFAULT true,
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 11. Pagos (Órdenes)
CREATE TABLE "payments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "buyerId" UUID REFERENCES "users"("id"),
    "productId" UUID REFERENCES "products"("id"),
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT DEFAULT 'COP',
    "status" TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'DECLINED'
    "transactionId" TEXT,
    "quantity" INTEGER DEFAULT 1,
    "discountApplied" BOOLEAN DEFAULT false,
    "discountCode" TEXT,
    "finalAmount" DECIMAL(12,2),
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 12. Plantillas de Saneamiento
CREATE TABLE "sanitation_templates" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "type" TEXT UNIQUE NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 13. Planes de Saneamiento Generados
CREATE TABLE "sanitation_plans" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ownerId" UUID REFERENCES "users"("id"),
    "businessName" TEXT NOT NULL,
    "establishmentType" TEXT NOT NULL,
    "status" TEXT DEFAULT 'COMPLETED',
    "content" JSONB NOT NULL,
    "verificationHash" TEXT UNIQUE,
    "certificateCode" TEXT UNIQUE,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 14. Certificados
CREATE TABLE "certificates" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "studentId" UUID REFERENCES "users"("id"),
    "enrollmentId" UUID REFERENCES "enrollments"("id"),
    "certificateCode" TEXT UNIQUE NOT NULL,
    "verificationHash" TEXT UNIQUE NOT NULL,
    "status" TEXT DEFAULT 'VALID',
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 15. Logs de Verificación
CREATE TABLE "verification_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "documentType" TEXT NOT NULL,
    "documentCode" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "verified" BOOLEAN DEFAULT false,
    "verifiedAt" TIMESTAMPTZ DEFAULT now()
);
