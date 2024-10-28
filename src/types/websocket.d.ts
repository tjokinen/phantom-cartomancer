interface WebSocketPair {
  0: WebSocket;
  1: WebSocket;
}

interface ResponseInit {
  status?: number;
  statusText?: string;
  headers?: HeadersInit;
}

interface WebSocketResponse extends Response {
  webSocket: WebSocket;
}
