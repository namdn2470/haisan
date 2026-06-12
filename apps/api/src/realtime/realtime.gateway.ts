import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@hsbx/db';
import { Server, Socket } from 'socket.io';
import { isAdminRole } from '../common/roles.decorator';

type RealtimeSocket = Socket & {
  data: {
    user?: {
      sub?: string;
      id?: string;
      role?: string;
    };
  };
};

function getAllowedOrigins() {
  const raw = process.env.CORS_ORIGINS || process.env.WEB_ORIGIN || '';
  const origins = raw.split(',').map(origin => origin.trim()).filter(Boolean);
  return origins.length
    ? origins
    : ['http://localhost:3000', 'http://localhost:3012', 'http://127.0.0.1:3000', 'http://127.0.0.1:3012'];
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  handleConnection(client: RealtimeSocket) {
    const token = this.extractToken(client);
    if (!token) return;

    try {
      client.data.user = this.jwt.verify(token);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect() {
    // Socket.IO automatically leaves rooms on disconnect.
  }

  @SubscribeMessage('admin:join')
  handleAdminJoin(@ConnectedSocket() client: RealtimeSocket) {
    if (!isAdminRole(client.data.user?.role)) {
      return { ok: false, error: 'FORBIDDEN' };
    }
    client.join('admin');
    return { ok: true };
  }

  @SubscribeMessage('user:join')
  handleUserJoin(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() body?: { userId?: string },
  ) {
    const currentUserId = this.getUserId(client);
    const requestedUserId = body?.userId || currentUserId;
    if (!requestedUserId || requestedUserId !== currentUserId) {
      return { ok: false, error: 'FORBIDDEN' };
    }
    client.join(`user:${requestedUserId}`);
    return { ok: true };
  }

  @SubscribeMessage('order:join')
  async handleOrderJoin(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() body?: { orderId?: string },
  ) {
    const orderId = body?.orderId;
    if (!orderId) return { ok: false, error: 'MISSING_ORDER_ID' };

    const user = client.data.user;
    const userId = this.getUserId(client);
    if (isAdminRole(user?.role)) {
      client.join(`order:${orderId}`);
      return { ok: true };
    }

    if (!userId) return { ok: false, error: 'UNAUTHORIZED' };
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true },
    });
    if (!order) return { ok: false, error: 'FORBIDDEN' };

    client.join(`order:${orderId}`);
    return { ok: true };
  }

  emitToAdmins(event: string, payload: unknown) {
    this.server.to('admin').emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToOrder(orderId: string, event: string, payload: unknown) {
    this.server.to(`order:${orderId}`).emit(event, payload);
  }

  private extractToken(client: RealtimeSocket) {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken) return authToken;

    const bearer = client.handshake.headers.authorization;
    if (typeof bearer === 'string' && bearer.startsWith('Bearer ')) {
      return bearer.slice(7);
    }

    return undefined;
  }

  private getUserId(client: RealtimeSocket) {
    return client.data.user?.sub || client.data.user?.id;
  }
}
