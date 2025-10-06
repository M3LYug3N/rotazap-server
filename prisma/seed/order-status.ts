import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const orderStatus = [
  "Новый заказ",
  "В работе",
  "Готов к выдаче",
  "Отгружено",

  "Отправлен поставщику",

  "Задержка",

  "Возвращено клиентом",
  "Заказ невозможен",
  "Отказ клиента",
];

async function main() {
  for (const name of orderStatus) {
    await prisma.orderStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("✅ Order statuses seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
