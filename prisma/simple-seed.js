const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Simplified seed starting...");

  const products = [
    {
      name: "Curso de Manipulación de Alimentos",
      slug: "curso-manipulacion-alimentos",
      description: "Obtén tu certificado oficial de manipulador de alimentos con nuestro curso online completo y homologado.",
      price: 29.99,
      type: "COURSE",
      isActive: true,
    },
    {
      name: "Plan de Saneamiento con IA",
      slug: "plan-saneamiento-ia",
      description: "Genera un plan de saneamiento profesional y personalizado para tu negocio en minutos utilizando inteligencia artificial.",
      price: 49.99,
      type: "AI_SERVICE",
      isActive: true,
    }
  ];

  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: productData,
      create: productData,
    });
    console.log(`✅ Product: ${product.name}`);
  }

  console.log("🎉 Simplified seed finished!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
