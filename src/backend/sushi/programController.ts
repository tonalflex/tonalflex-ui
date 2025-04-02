import {
  ProcessorIdentifier,
  ProgramIdentifier,
  ProcessorProgramIdentifier,
  ProgramInfoList,
  ProcessorProgramSetRequest,
} from "@/proto/sushi/sushi_rpc";
import { ProgramControllerClient } from "@/proto/sushi/sushi_rpc.client";
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { RpcError } from "@protobuf-ts/runtime-rpc";
import type { RpcInterceptor, RpcOptions, UnaryCall, MethodInfo } from "@protobuf-ts/runtime-rpc";

class SushiProgramController {
  private transport: GrpcWebFetchTransport;
  private client: ProgramControllerClient;

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

    this.client = new ProgramControllerClient(this.transport);
  }

  /**
   * Get the current program of a processor.
   */
  async getProcessorCurrentProgram(processorId: number): Promise<ProgramIdentifier> {
    const { response } = await this.client.getProcessorCurrentProgram(
      ProcessorIdentifier.create({ id: processorId })
    );
    return response;
  }

  /**
   * Get the current program name of a processor.
   */
  async getProcessorCurrentProgramName(processorId: number): Promise<string> {
    const { response } = await this.client.getProcessorCurrentProgramName(
      ProcessorIdentifier.create({ id: processorId })
    );
    return response.value;
  }

  /**
   * Get a specific program name for a processor.
   */
  async getProcessorProgramName(processorId: number, programId: number): Promise<string> {
    const { response } = await this.client.getProcessorProgramName(
      ProcessorProgramIdentifier.create({
        processor: ProcessorIdentifier.create({ id: processorId }),
        program: programId,
      })
    );
    return response.value;
  }

  /**
   * Get all programs for a processor.
   */
  async getProcessorPrograms(processorId: number): Promise<ProgramInfoList> {
    const { response } = await this.client.getProcessorPrograms(
      ProcessorIdentifier.create({ id: processorId })
    );
    return response;
  }

  /**
   * Set the program for a processor.
   */
  async setProcessorProgram(processorId: number, programId: number): Promise<void> {
    const request = ProcessorProgramSetRequest.create({
      processor: ProcessorIdentifier.create({ id: processorId }),
      program: ProgramIdentifier.create({ program: programId }),
    });
    await this.client.setProcessorProgram(request);
    console.log(`Set program ID ${programId} for processor ID ${processorId}.`);
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

export default SushiProgramController;
