import { Response } from 'express';

export class SseBroker {
  private clients: Set<Response> = new Set();

  registerClient(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    this.clients.add(res);

    // Send connection established event
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  broadcast(event: string, payload: any): void {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const message = `event: ${event}\ndata: ${data}\n\n`;

    for (const client of this.clients) {
      try {
        client.write(message);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  get activeClientCount(): number {
    return this.clients.size;
  }
}
