"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// prisma/seed.ts
var import_client = require("@prisma/client");
var import_bcryptjs = __toESM(require("bcryptjs"));
var prisma = new import_client.PrismaClient();
async function main() {
  console.log("\u{1F331} Seeding database...\n");
  const adminPassword = await import_bcryptjs.default.hash("admin123456", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bpmsalud.com" },
    update: {},
    create: {
      email: "admin@bpmsalud.com",
      name: "Administrador BPM",
      passwordHash: adminPassword,
      role: import_client.Role.ADMIN
    }
  });
  console.log("\u2705 Admin user created:", admin.email);
  const products = [
    {
      name: "Curso de Manipulaci\xF3n de Alimentos",
      slug: "manipulacion-alimentos",
      description: "Obt\xE9n tu certificado oficial de manipulador de alimentos con nuestro curso online completo y homologado.",
      price: 29.99,
      type: import_client.ProductType.COURSE,
      isActive: true
    },
    {
      name: "Plan de Saneamiento con IA",
      slug: "plan-saneamiento-iav",
      description: "Genera un plan de saneamiento profesional y personalizado para tu negocio en minutos utilizando inteligencia artificial.",
      price: 49.99,
      type: import_client.ProductType.AI_SERVICE,
      isActive: true
    }
  ];
  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: productData,
      create: productData
    });
    console.log(`\u2705 Product processed: ${product.name}`);
    if (product.slug === "manipulacion-alimentos") {
      const course = await prisma.course.upsert({
        where: { productId: product.id },
        update: {
          title: "Curso de Manipulaci\xF3n de Alimentos",
          description: "Curso completo para obtener el certificado oficial.",
          passingScore: 80
        },
        create: {
          productId: product.id,
          title: "Curso de Manipulaci\xF3n de Alimentos",
          description: "Curso completo para obtener el certificado oficial.",
          passingScore: 80,
          modules: {
            create: [
              {
                title: "M\xF3dulo 1: Introducci\xF3n a la Higiene",
                sortOrder: 1,
                videos: {
                  create: [
                    {
                      title: "Bienvenida e Importancia",
                      videoUrl: "https://example.com/video1",
                      sortOrder: 1
                    },
                    {
                      title: "Tipos de Contaminaci\xF3n",
                      videoUrl: "https://example.com/video2",
                      sortOrder: 2
                    }
                  ]
                }
              },
              {
                title: "M\xF3dulo 2: Manipulaci\xF3n Segura",
                sortOrder: 2,
                videos: {
                  create: [
                    {
                      title: "Lavado de Manos Correcto",
                      videoUrl: "https://example.com/video3",
                      sortOrder: 1
                    }
                  ]
                }
              }
            ]
          }
        }
      });
      console.log(`\u2705 Course structure created for: ${course.title}`);
      const questions = [
        {
          question: "\xBFCu\xE1l es la temperatura m\xEDnima recomendada para la cocci\xF3n de aves?",
          options: ["60\xB0C", "74\xB0C", "85\xB0C", "100\xB0C"],
          correctAnswer: 1
        },
        {
          question: "\xBFQu\xE9 es la contaminaci\xF3n cruzada?",
          options: [
            "El paso de microorganismos de un alimento contaminado a otro que no lo est\xE1.",
            "Cocinar dos alimentos diferentes al mismo tiempo.",
            "Lavar los alimentos antes de consumirlos.",
            "Almacenar alimentos en el refrigerador."
          ],
          correctAnswer: 0
        },
        {
          question: "\xBFCon qu\xE9 frecuencia deben lavarse las manos un manipulador de alimentos?",
          options: [
            "Cada 2 horas.",
            "Solo al inicio de la jornada.",
            "Despu\xE9s de cualquier interrupci\xF3n o manipulaci\xF3n de residuos.",
            "Solo despu\xE9s de ir al ba\xF1o."
          ],
          correctAnswer: 2
        },
        {
          question: "\xBFCu\xE1l es la zona de peligro de temperatura para los alimentos?",
          options: ["0\xB0C a 10\xB0C", "5\xB0C a 60\xB0C", "10\xB0C a 40\xB0C", "20\xB0C a 80\xB0C"],
          correctAnswer: 1
        }
      ];
      for (const q of questions) {
        await prisma.question.create({
          data: {
            courseId: course.id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer
          }
        });
      }
      console.log(`\u2705 Questions seeded for: ${course.title}`);
    }
  }
  const templates = [
    {
      name: "Plan Est\xE1ndar - Preparaci\xF3n de Alimentos",
      description: "Plantilla base para restaurantes, cafeter\xEDas y cocinas industriales.",
      type: "PREPARACION",
      content: {
        cleaning: "Limpieza profunda de superficies de contacto directo...",
        pests: "Control preventivo de insectos y roedores en \xE1reas de almacenamiento...",
        waste: "Separaci\xF3n en la fuente: org\xE1nicos, reciclables y no aprovechables...",
        hygiene: "Uso obligatorio de cofia, tapabocas y delantal claro..."
      }
    },
    {
      name: "Plan Est\xE1ndar - Fruver / Almacenamiento",
      description: "Enfocado en control de humedad y rotaci\xF3n de producto fresco.",
      type: "ALMACENAMIENTO",
      content: {
        cleaning: "Desinfecci\xF3n de canastillas y estibas con soluci\xF3n clorada...",
        pests: "Monitoreo de moscas de fruta y control de humedad...",
        waste: "Manejo especial de residuos org\xE1nicos en descomposici\xF3n acelerada...",
        hygiene: "Protocolo de desinfecci\xF3n de calzado al ingreso..."
      }
    }
  ];
  for (const t of templates) {
    await prisma.sanitationTemplate.upsert({
      where: { name: t.name },
      update: t,
      create: t
    });
  }
  console.log("\u2705 Sanitation templates seeded.");
  const discountCodes = [
    {
      code: "SANIDAD10",
      discountPercent: 10,
      isActive: true
    }
  ];
  for (const codeData of discountCodes) {
    await prisma.discountCode.upsert({
      where: { code: codeData.code },
      update: codeData,
      create: codeData
    });
    console.log(`\u2705 Discount code processed: ${codeData.code}`);
  }
  console.log("\n\u{1F389} Seed completed successfully!");
}
main().then(async () => {
  await prisma.$disconnect();
}).catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
