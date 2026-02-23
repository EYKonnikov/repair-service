import { drizzle } from "drizzle-orm/node-postgres";
import { users, requests } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  if (!process.env.DATABASE_URL) return;
  const db = drizzle(process.env.DATABASE_URL);

  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) return;

  const [dispatcher] = await db
    .insert(users)
    .values({
      username: "dispatcher",
      password: "dispatcher123",
      role: "dispatcher",
      fullName: "Анна Петрова",
    })
    .returning();

  const [master1] = await db
    .insert(users)
    .values({
      username: "master1",
      password: "master123",
      role: "master",
      fullName: "Иван Сидоров",
    })
    .returning();

  const [master2] = await db
    .insert(users)
    .values({
      username: "master2",
      password: "master123",
      role: "master",
      fullName: "Дмитрий Козлов",
    })
    .returning();

  await db.insert(requests).values([
    {
      clientName: "Сергей Иванов",
      phone: "+7 (495) 123-45-67",
      address: "Москва, ул. Тверская, д. 15, кв. 42",
      problemText: "Течёт кран на кухне. Вода капает постоянно, нужен срочный ремонт.",
      status: "new",
    },
    {
      clientName: "Мария Кузнецова",
      phone: "+7 (495) 987-65-43",
      address: "Москва, пр. Ленина, д. 28, кв. 7",
      problemText: "Перестала работать розетка в гостиной. Нет напряжения в двух розетках на южной стене.",
      status: "assigned",
      assignedTo: master1.id,
    },
    {
      clientName: "Алексей Попов",
      phone: "+7 (495) 555-12-34",
      address: "Москва, ул. Арбат, д. 5, кв. 101",
      problemText: "Не работает батарея отопления в спальне. Температура в комнате опускается ниже 15 градусов ночью.",
      status: "in_progress",
      assignedTo: master2.id,
    },
    {
      clientName: "Елена Соколова",
      phone: "+7 (495) 333-44-55",
      address: "Москва, ул. Пушкина, д. 10, кв. 23",
      problemText: "Сломалась ручка окна в детской комнате. Невозможно нормально открыть или закрыть окно.",
      status: "new",
    },
    {
      clientName: "Виктор Орлов",
      phone: "+7 (495) 777-88-99",
      address: "Москва, пр. Гагарина, д. 33, кв. 56",
      problemText: "Засорился слив в ванной. Вода не уходит совсем, возможен засор глубоко в трубах.",
      status: "done",
      assignedTo: master1.id,
    },
  ]);

  console.log("База данных заполнена начальными данными");
}
