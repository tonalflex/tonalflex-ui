// src/stores/butlerStore.ts
import {
  SessionServiceClient,
} from '@/proto/butler/butler.client';
import {
  SaveSessionRequest,
  LoadSessionRequest,
  ListSessionsRequest,
  DeleteSessionRequest,
  SaveSessionResponse,
  LoadSessionResponse,
  ListSessionsResponse,
  DeleteSessionResponse,
} from '@/proto/butler/butler';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import type { RpcInterceptor, RpcOptions, UnaryCall, MethodInfo } from '@protobuf-ts/runtime-rpc';
import { RpcError } from '@protobuf-ts/runtime-rpc';

class ButlerController {
  private transport: GrpcWebFetchTransport;
  private client: SessionServiceClient;

  constructor(baseUrl: string) {
    const interceptor: RpcInterceptor = {
      interceptUnary<T extends object, U extends object>(
        next: (method: MethodInfo<T, U>, input: T, options: RpcOptions) => UnaryCall<T, U>,
        method: MethodInfo<T, U>,
        input: T,
        options: RpcOptions
      ): UnaryCall<T, U> {
        const updatedOptions: RpcOptions = {
          ...options,
          meta: {
            ...options?.meta,
            TE: "trailers",
          },
        };
        return next(method, input, updatedOptions);
      },
    };

    this.transport = new GrpcWebFetchTransport({
      baseUrl,
      interceptors: [interceptor],
    });

    this.client = new SessionServiceClient(this.transport);
  }

  async saveSession(name: string, jsonData: string): Promise<SaveSessionResponse> {
    const request = SaveSessionRequest.create({ name, jsonData });
    const { response } = await this.client.saveSession(request);
    return response;
  }

  async loadSession(name: string): Promise<LoadSessionResponse> {
    const request = LoadSessionRequest.create({ name });
    const { response } = await this.client.loadSession(request);
    return response;
  }

  async listSessions(): Promise<ListSessionsResponse> {
    const { response } = await this.client.listSessions(ListSessionsRequest.create());
    return response;
  }

  async deleteSession(name: string): Promise<DeleteSessionResponse> {
    const request = DeleteSessionRequest.create({ name });
    const { response } = await this.client.deleteSession(request);
    return response;
  }

  private handleError(err: unknown, context: string): void {
    if (err instanceof RpcError) {
      console.error(`[Butler] Error ${context}:`, err.message);
    } else {
      console.error(`[Butler] Unknown error ${context}:`, err);
    }
  }
}

export default ButlerController;
