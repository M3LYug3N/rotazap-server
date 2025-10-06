import type {
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: [
      "http://localhost:3000",
      "http://rotazap.ru",
      "http://www.rotazap.ru",
      "https://rotazap.ru",
      "https://www.rotazap.ru",
    ],
  },
}) // Убедитесь, что CORS разрешен
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  handleConnection(client: any) {
    console.log(`Клиент подключился: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Клиент отключился: ${client.id}`);
  }

  // Метод для уведомления об обновлении роли
  notifyRoleUpdate(userId: number, role: string) {
    console.log(
      `Отправка события roleUpdate для пользователя ${userId} с ролью ${role}`,
    );
    this.server.emit(`roleUpdate:${userId}`, role); // Отправка события клиенту
  }
}
