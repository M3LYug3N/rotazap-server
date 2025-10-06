import { Injectable, NotFoundException } from "@nestjs/common";

import { CreateOrderLinesStatusDto } from "@/modules/order-lines-status/dto/create-order-lines-status.dto";
import { PrismaService } from "@/modules/prisma/prisma.service";

@Injectable()
export class OrderLinesStatusService {
  constructor(private prisma: PrismaService) {}

  // Создание нового статуса для строки заказа
  async create(dto: CreateOrderLinesStatusDto) {
    const { orderLineId, orderStatusId, qty, createdAt } = dto;

    const orderLine = await this.prisma.orderLines.findUnique({
      where: { id: orderLineId },
      include: {
        orderLineStatus: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { orderStatus: true },
        },
      },
    });
    if (!orderLine) throw new NotFoundException("OrderLine не найден");

    const newStatus = await this.prisma.orderStatus.findUnique({
      where: { id: orderStatusId },
    });
    if (!newStatus) throw new NotFoundException("OrderStatus не найден");

    // Линейка допустимых переходов (id или name)
    const mainChain = [
      "Новый заказ",
      "В работе",
      "Готов к выдаче",
      "Отгружено",
    ];

    const terminalStatuses = [
      "Отказ клиента",
      "Заказ невозможен",
      "Возвращено клиентом",
    ];

    const delayStatus = "Задержка";

    const lastStatus = orderLine.orderLineStatus[0]?.orderStatus.name;

    // Если последний статус терминальный — запрещаем менять
    if (lastStatus && terminalStatuses.includes(lastStatus)) {
      throw new Error("Нельзя изменить статус после терминального");
    }

    // Если новый статус терминальный — разрешаем с любого шага
    if (terminalStatuses.includes(newStatus.name)) {
      return this.prisma.orderLinesStatus.create({
        data: {
          orderLineId,
          orderStatusId,
          qty,
          createdAt: createdAt || new Date(),
        },
      });
    }

    // Если задержка — просто добавляем, цепочку не трогаем
    if (newStatus.name === delayStatus) {
      return this.prisma.orderLinesStatus.create({
        data: {
          orderLineId,
          orderStatusId,
          qty,
          createdAt: createdAt || new Date(),
        },
      });
    }

    // Проверка на корректность перехода в рамках основной цепочки
    if (lastStatus) {
      const lastIndex = mainChain.indexOf(lastStatus);
      const newIndex = mainChain.indexOf(newStatus.name);

      if (newIndex === -1) {
        throw new Error("Новый статус не найден в основной цепочке");
      }
      if (newIndex < lastIndex) {
        throw new Error("Регресс по статусам запрещен");
      }
      if (newIndex > lastIndex + 1) {
        throw new Error("Пропуск шагов в цепочке запрещен");
      }
    } else {
      // Если статусов ещё нет — первый должен быть начальным
      if (newStatus.name !== mainChain[0]) {
        throw new Error(`Первый статус должен быть "${mainChain[0]}"`);
      }
    }

    // Всё ок — создаём запись
    return this.prisma.orderLinesStatus.create({
      data: {
        orderLineId,
        orderStatusId,
        qty,
        createdAt: createdAt || new Date(),
      },
    });
  }

  // Получение временной шкалы для строки заказа
  async getTimelineForOrderLine(orderLineId: number) {
    // Основная цепочка в порядке шагов
    const mainChain = [
      "Новый заказ",
      "В работе",
      "Готов к выдаче",
      "Отгружено",
    ];

    const terminalStatuses = [
      "Отказ клиента",
      "Заказ невозможен",
      "Возвращено клиентом",
    ];
    const delayStatus = "Задержка";

    // История
    const history = await this.prisma.orderLinesStatus.findMany({
      where: { orderLineId },
      orderBy: { createdAt: "asc" },
      include: { orderStatus: true },
    });

    if (!history.length) {
      throw new NotFoundException(
        "Статусы для указанного OrderLine не найдены",
      );
    }

    const timeline = mainChain.map((name) => ({
      name,
      date: null as Date | null,
      completed: false,
      current: false,
      isDelay: false,
      isTerminal: false,
    }));

    let currentStepIndex = -1;
    let terminal: { name: string; date: Date } | null = null;

    for (const h of history) {
      const { name } = h.orderStatus;
      const idx = mainChain.indexOf(name);

      if (idx !== -1) {
        // Это шаг основной цепочки
        timeline[idx].date = h.createdAt;
        currentStepIndex = idx;
      }

      if (name === delayStatus && currentStepIndex !== -1) {
        // Задержка на текущем шаге
        timeline[currentStepIndex].isDelay = true;
      }

      if (terminalStatuses.includes(name)) {
        terminal = { name, date: h.createdAt };
        break; // дальше цепочка не идёт
      }
    }

    // Отмечаем пройденные и текущий шаг
    timeline.forEach((step, idx) => {
      if (idx < currentStepIndex) step.completed = true;
      if (idx === currentStepIndex) step.current = true;
    });

    // Если есть терминальный статус
    if (terminal) {
      // Обрываем всё, что после текущего
      timeline.forEach((step, idx) => {
        if (idx > currentStepIndex) {
          step.completed = false;
          step.current = false;
        }
      });

      // Вставляем терминал отдельным объектом
      timeline.push({
        name: terminal.name,
        date: terminal.date,
        completed: true,
        current: true,
        isDelay: false,
        isTerminal: true,
      });
    }

    return timeline;
  }

  // Получение всех статусов для строки заказа
  async getStatusesForOrderLine(orderLineId: number) {
    const statuses = await this.prisma.orderLinesStatus.findMany({
      where: { orderLineId },
      orderBy: { createdAt: "asc" }, // Порядок по дате создания
      include: { orderStatus: true }, // Включаем детали статуса
    });

    if (statuses.length === 0) {
      throw new NotFoundException(
        "Статусы для указанного OrderLine не найдены",
      );
    }

    return statuses;
  }
}
