-- 1. Insertar Productos
INSERT INTO "products" ("name", "description", "price", "type", "slug", "imageUrl") VALUES
('Curso de Manipulación de Alimentos', 'Certificacion en Buenas Prácticas de Manipulacion de Alimentos para los procesos de transporte, fabricación, almacenamiento, distribución, comercialización y preparación de alimentos.', 45000, 'COURSE', 'manipulacion-alimentos', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800'),
('Plan de Saneamiento', 'Obten tu plan de saneamiento en minutos. Verificable y firmado por profesional autorizado.', 120000, 'AI_SERVICE', 'plan-saneamiento-ia', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800');

-- 2. Insertar Curso
DO $$
DECLARE
    prod_id UUID;
    course_id UUID;
BEGIN
    SELECT id INTO prod_id FROM "products" WHERE slug = 'manipulacion-alimentos';
    
    INSERT INTO "courses" ("productId", "title", "description", "totalLessons", "passingScore")
    VALUES (prod_id, 'Manipulación de Alimentos e Higiene', 'Aprende las mejores prácticas de higiene y normatividad vigente.', 3, 80)
    RETURNING id INTO course_id;

    -- 3. Videos
    INSERT INTO "course_videos" ("courseId", "title", "url", "duration", "order") VALUES
    (course_id, 'Introducción a la Inocuidad', 'https://www.w3schools.com/html/mov_bbb.mp4', 300, 1),
    (course_id, 'Contaminación Cruzada', 'https://www.w3schools.com/html/movie.mp4', 450, 2),
    (course_id, 'Higiene del Personal', 'https://www.w3schools.com/html/mov_bbb.mp4', 500, 3);

    -- 4. Preguntas para el examen
    INSERT INTO "questions" ("courseId", "text") VALUES
    (course_id, '¿Qué es la contaminación cruzada?'),
    (course_id, '¿Cuál es la temperatura mínima para cocinar aves?'),
    (course_id, '¿Cada cuánto debe lavarse las manos un manipulador?');

    -- Respuestas (Correctas e Incorrectas)
    WITH q1 AS (SELECT id FROM "questions" WHERE text = '¿Qué es la contaminación cruzada?')
    INSERT INTO "answers" ("questionId", "text", "isCorrect") SELECT id, 'Paso de microorganismos de un alimento contaminado a uno sano', true FROM q1;
    WITH q1 AS (SELECT id FROM "questions" WHERE text = '¿Qué es la contaminación cruzada?')
    INSERT INTO "answers" ("questionId", "text", "isCorrect") SELECT id, 'Cocinar demasiado un alimento', false FROM q1;

END $$;

-- 5. Plantillas de Saneamiento
INSERT INTO "sanitation_templates" ("type", "content") VALUES
('preparacion', '{
    "cleaning": "Protocolos estrictos de desinfección en superficies de contacto.",
    "pests": "Control mensual con estaciones cebaderas perimetrales.",
    "waste": "Separación en fuente: Orgánicos, Aprovechables y No Aprovechables.",
    "hygiene": "Uso obligatorio de cofia, tapabocas y delantal blanco."
}'),
('carniceria', '{
    "cleaning": "Despelleje y desinfección profunda de ganchos y sierras diariamente.",
    "pests": "Monitoreo de insectos voladores con trampas de luz UV.",
    "waste": "Manejo especial de residuos cárnicos y grasas.",
    "hygiene": "Uso de guantes de malla y petos impermeables."
}');

-- 6. Cupón de Descuento
INSERT INTO "discount_codes" ("code", "percentage", "active") VALUES
('SANIDAD10', 10, true);

-- 7. Usuario Administrador de Prueba
-- Email: admin@bpmsalud.com | Password: admin123
INSERT INTO "users" ("email", "name", "passwordHash", "role", "isActive") VALUES
('admin@bpmsalud.com', 'Administrador BPM', '$2b$10$rYM/MA2B5CpUSl58h.l2wORq6cwgQ.gntIWCazFjPt/5Jq1mWJNIq', 'ADMIN', true),
('comprador@bpmsalud.com', 'Comprador de Prueba', '$2b$10$X/5taprHHc2/5izFuq.t1.A19ylfhcMkJxR3v1uXJHet5PvGgZ2RK', 'BUYER', true)
ON CONFLICT ("email") DO NOTHING;
