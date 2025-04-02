import {
  GenericVoidValue,
  SushiBuildInfo,
} from "@/proto/sushi/sushi_rpc";
import {
  SystemControllerClient,
} from "@/proto/sushi/sushi_rpc.client";
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { RpcError } from "@protobuf-ts/runtime-rpc";
import type { RpcInterceptor, RpcOptions, UnaryCall, MethodInfo } from "@protobuf-ts/runtime-rpc";

class SushiSystemController {
  private transport: GrpcWebFetchTransport;
  private client: SystemControllerClient;

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
      useBinaryFormat: true,
    });

    this.client = new SystemControllerClient(this.transport);
  }

  /**
   * Fetch Sushi version.
   */
  async getSushiVersion(): Promise<string> {
    try {
      const { response } = await this.client.getSushiVersion(GenericVoidValue.create());
      return response.value || "";
    } catch (err) {
      this.handleError(err, "Error fetching Sushi version");
      throw err;
    }
  }

  /**
   * Fetch Sushi build information.
   */
  async getBuildInfo(): Promise<SushiBuildInfo> {
    try {
      const { response } = await this.client.getBuildInfo(GenericVoidValue.create());
      return response;
    } catch (err) {
      this.handleError(err, "Error fetching Sushi build info");
      throw err;
    }
  }

  /**
   * Get input audio channel count.
   */
  async getInputAudioChannelCount(): Promise<number> {
    try {
      const { response } = await this.client.getInputAudioChannelCount(GenericVoidValue.create());
      return response.value || 0;
    } catch (err) {
      this.handleError(err, "Error fetching input audio channel count");
      throw err;
    }
  }

  /**
   * Get output audio channel count.
   */
  async getOutputAudioChannelCount(): Promise<number> {
    try {
      const { response } = await this.client.getOutputAudioChannelCount(GenericVoidValue.create());
      return response.value || 0;
    } catch (err) {
      this.handleError(err, "Error fetching output audio channel count");
      throw err;
    }
  }

  /**
   * Handle errors for gRPC calls.
   */
  private handleError(err: unknown, message: string): void {
    if (err instanceof RpcError) {
      console.error(`${message}: ${err.message}`);
    } else {
      console.error(`${message}: Unknown error`, err);
    }
  }
}

export default SushiSystemController;
