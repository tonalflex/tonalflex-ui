import {
  GenericVoidValue,
  OscParameterOutputList,
  ParameterIdentifier,
} from "@/proto/sushi/sushi_rpc";
import { OscControllerClient } from "@/proto/sushi/sushi_rpc.client"; // Use the gRPC client
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { RpcError } from "@protobuf-ts/runtime-rpc";
import type { RpcInterceptor, RpcOptions, MethodInfo, UnaryCall } from "@protobuf-ts/runtime-rpc";


class SushiOscController {
  private transport: GrpcWebFetchTransport;
  private client: OscControllerClient;

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

    this.client = new OscControllerClient(this.transport);
  }

  /**
   * Get the send IP address.
   */
  async getSendIP(): Promise<string> {
    const { response } = await this.client.getSendIP(GenericVoidValue.create());
    return response.value;
  }

  /**
   * Get the send port.
   */
  async getSendPort(): Promise<number> {
    const { response } = await this.client.getSendPort(GenericVoidValue.create());
    return response.value;
  }

  /**
   * Get the receive port.
   */
  async getReceivePort(): Promise<number> {
    const { response } = await this.client.getReceivePort(GenericVoidValue.create());
    return response.value;
  }

  /**
   * Get all enabled parameter outputs.
   */
  async getEnabledParameterOutputs(): Promise<OscParameterOutputList> {
    const { response } = await this.client.getEnabledParameterOutputs(GenericVoidValue.create());
    return response;
  }

  /**
   * Enable output for a specific parameter.
   */
  async enableOutputForParameter(processorId: number, parameterId: number): Promise<void> {
    const request = ParameterIdentifier.create({
      processorId,
      parameterId,
    });
    await this.client.enableOutputForParameter(request);
  }

  /**
   * Disable output for a specific parameter.
   */
  async disableOutputForParameter(processorId: number, parameterId: number): Promise<void> {
    const request = ParameterIdentifier.create({
      processorId,
      parameterId,
    });
    await this.client.disableOutputForParameter(request);
  }

  /**
   * Enable output for all parameters.
   */
  async enableAllOutput(): Promise<void> {
    await this.client.enableAllOutput(GenericVoidValue.create());
  }

  /**
   * Disable output for all parameters.
   */
  async disableAllOutput(): Promise<void> {
    await this.client.disableAllOutput(GenericVoidValue.create());
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

export default SushiOscController;
