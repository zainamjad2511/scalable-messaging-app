import WebSocket from "ws";
import { ServerPayload } from "@repo/types";

export interface ConnectedClient {
  socketId: string;
  userId: string;
  username: string;
  ws: WebSocket;
  joinedAt: Date;
}

class ConnectionManager {
  private clients = new Map<string, ConnectedClient>();

  add(client: ConnectedClient): void {
    this.clients.set(client.socketId, client);
  }

  remove(socketId: string): ConnectedClient | undefined {
    const client = this.clients.get(socketId);
    if (client) {
      this.clients.delete(socketId);
    }
    return client;
  }

  getClient(socketId: string): ConnectedClient | undefined {
    return this.clients.get(socketId);
  }

  getCount(): number {
    return this.clients.size;
  }

  getUsernames(): string[] {
    return Array.from(this.clients.values()).map((c) => c.username);
  }

  isUsernameTaken(username: string): boolean {
    return Array.from(this.clients.values()).some(
      (c) => c.username.toLowerCase() === username.toLowerCase()
    );
  }

  broadcast(payload: ServerPayload, excludeSocketId?: string): void {
    const data = JSON.stringify(payload);
    for (const [id, client] of this.clients.entries()) {
      if (id !== excludeSocketId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    }
  }

  broadcastAll(payload: ServerPayload): void {
    this.broadcast(payload);
  }

  send(socketId: string, payload: ServerPayload): void {
    const client = this.clients.get(socketId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(payload));
    }
  }
}

export const connectionManager = new ConnectionManager();
