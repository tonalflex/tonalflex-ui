import {
  GenericVoidValue,
  ProcessorIdentifier,
  CvConnection,
  GateConnection,
} from "@/proto/sushi/sushi_rpc";
import { CvGateControllerClient } from "@/proto/sushi/sushi_rpc.client"; // Use sushi_rpc.client.ts
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import type { RpcInterceptor, RpcOptions, UnaryCall, MethodInfo } from "@protobuf-ts/runtime-rpc";
import { RpcError } from "@protobuf-ts/runtime-rpc";

class SushiCvGateController {
  private transport: GrpcWebFetchTransport;
  private client: CvGateControllerClient;

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

    this.client = new CvGateControllerClient(this.transport);
  }

  /**
   * Get the CV input channel count.
   */
  async getCvInputChannelCount(): Promise<number> {
    try {
      const { response } = await this.client.getCvInputChannelCount(GenericVoidValue.create());
      return response.value;
    } catch (err) {
      this.handleError(err, "Error fetching CV input channel count");
      throw err;
    }
  }

  /**
   * Get the CV output channel count.
   */
  async getCvOutputChannelCount(): Promise<number> {
    try {
      const { response } = await this.client.getCvOutputChannelCount(GenericVoidValue.create());
      return response.value;
    } catch (err) {
      this.handleError(err, "Error fetching CV output channel count");
      throw err;
    }
  }

  /**
   * Get all CV input connections.
   */
  async getAllCvInputConnections(): Promise<CvConnection[]> {
    try {
      const { response } = await this.client.getAllCvInputConnections(GenericVoidValue.create());
      return response.connections;
    } catch (err) {
      this.handleError(err, "Error fetching all CV input connections");
      throw err;
    }
  }

  /**
   * Get all CV output connections.
   */
  async getAllCvOutputConnections(): Promise<CvConnection[]> {
    try {
      const { response } = await this.client.getAllCvOutputConnections(GenericVoidValue.create());
      return response.connections;
    } catch (err) {
      this.handleError(err, "Error fetching all CV output connections");
      throw err;
    }
  }

  /**
   * Get all gate input connections.
   */
  async getAllGateInputConnections(): Promise<GateConnection[]> {
    try {
      const { response } = await this.client.getAllGateInputConnections(GenericVoidValue.create());
      return response.connections;
    } catch (err) {
      this.handleError(err, "Error fetching all gate input connections");
      throw err;
    }
  }

  /**
   * Get all gate output connections.
   */
  async getAllGateOutputConnections(): Promise<GateConnection[]> {
    try {
      const { response } = await this.client.getAllGateOutputConnections(GenericVoidValue.create());
      return response.connections;
    } catch (err) {
      this.handleError(err, "Error fetching all gate output connections");
      throw err;
    }
  }

  /**
   * Get CV input connections for a processor.
   */
  async getCvInputConnectionsForProcessor(processorId: number): Promise<CvConnection[]> {
    try {
      const { response } = await this.client.getCvInputConnectionsForProcessor(ProcessorIdentifier.create({ id: processorId }));
      return response.connections;
    } catch (err) {
      this.handleError(err, `Error fetching CV input connections for processor ID ${processorId}`);
      throw err;
    }
  }

  /**
   * Get CV output connections for a processor.
   */
  async getCvOutputConnectionsForProcessor(processorId: number): Promise<CvConnection[]> {
    try {
      const { response } = await this.client.getCvOutputConnectionsForProcessor(ProcessorIdentifier.create({ id: processorId }));
      return response.connections;
    } catch (err) {
      this.handleError(err, `Error fetching CV output connections for processor ID ${processorId}`);
      throw err;
    }
  }

  /**
   * Get gate input connections for a processor.
   */
  async getGateInputConnectionsForProcessor(processorId: number): Promise<GateConnection[]> {
    try {
      const { response } = await this.client.getGateInputConnectionsForProcessor(ProcessorIdentifier.create({ id: processorId }));
      return response.connections;
    } catch (err) {
      this.handleError(err, `Error fetching gate input connections for processor ID ${processorId}`);
      throw err;
    }
  }

  /**
   * Get gate output connections for a processor.
   */
  async getGateOutputConnectionsForProcessor(processorId: number): Promise<GateConnection[]> {
    try {
      const { response } = await this.client.getGateOutputConnectionsForProcessor(ProcessorIdentifier.create({ id: processorId }));
      return response.connections;
    } catch (err) {
      this.handleError(err, `Error fetching gate output connections for processor ID ${processorId}`);
      throw err;
    }
  }

  /**
   * Connect CV input to a parameter.
   */
  async connectCvInputToParameter(connection: CvConnection): Promise<void> {
    await this.client.connectCvInputToParameter(connection);
  }

  /**
   * Connect CV output from a parameter.
   */
  async connectCvOutputFromParameter(connection: CvConnection): Promise<void> {
    await this.client.connectCvOutputFromParameter(connection);
  }

  /**
   * Connect gate input to a processor.
   */
  async connectGateInputToProcessor(connection: GateConnection): Promise<void> {
    await this.client.connectGateInputToProcessor(connection);
  }

  /**
   * Connect gate output from a processor.
   */
  async connectGateOutputFromProcessor(connection: GateConnection): Promise<void> {
    await this.client.connectGateOutputFromProcessor(connection);
  }

  /**
   * Disconnect CV input.
   */
  async disconnectCvInput(connection: CvConnection): Promise<void> {
    await this.client.disconnectCvInput(connection);
  }

  /**
   * Disconnect CV output.
   */
  async disconnectCvOutput(connection: CvConnection): Promise<void> {
    await this.client.disconnectCvOutput(connection);
  }

  /**
   * Disconnect gate input.
   */
  async disconnectGateInput(connection: GateConnection): Promise<void> {
    await this.client.disconnectGateInput(connection);
  }

  /**
   * Disconnect gate output.
   */
  async disconnectGateOutput(connection: GateConnection): Promise<void> {
    await this.client.disconnectGateOutput(connection);
  }

  /**
   * Disconnect all CV inputs from a processor.
   */
  async disconnectAllCvInputsFromProcessor(processorId: number): Promise<void> {
    await this.client.disconnectAllCvInputsFromProcessor(ProcessorIdentifier.create({ id: processorId }));
  }

  /**
   * Disconnect all CV outputs from a processor.
   */
  async disconnectAllCvOutputsFromProcessor(processorId: number): Promise<void> {
    await this.client.disconnectAllCvOutputsFromProcessor(ProcessorIdentifier.create({ id: processorId }));
  }

  /**
   * Disconnect all gate inputs from a processor.
   */
  async disconnectAllGateInputsFromProcessor(processorId: number): Promise<void> {
    await this.client.disconnectAllGateInputsFromProcessor(ProcessorIdentifier.create({ id: processorId }));
  }

  /**
   * Disconnect all gate outputs from a processor.
   */
  async disconnectAllGateOutputsFromProcessor(processorId: number): Promise<void> {
    await this.client.disconnectAllGateOutputsFromProcessor(ProcessorIdentifier.create({ id: processorId }));
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

export default SushiCvGateController;
