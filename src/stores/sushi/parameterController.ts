import {
  ParameterController,
  TrackIdentifier,
  ProcessorIdentifier,
  ParameterIdRequest,
  ParameterIdentifier,
  ParameterInfoList,
  ParameterInfo,
  ParameterValue,
  PropertyInfoList,
  PropertyIdRequest,
  PropertyIdentifier,
  PropertyInfo,
  PropertyValue,
} from "@/proto/sushi/sushi_rpc";
import { ParameterControllerClient } from "@/proto/sushi/sushi_rpc.client"; // Use the gRPC client
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { RpcError } from "@protobuf-ts/runtime-rpc";
import type { RpcInterceptor, RpcOptions, UnaryCall, MethodInfo } from "@protobuf-ts/runtime-rpc";

class SushiParameterController {
  private transport: GrpcWebFetchTransport;
  private client: ParameterControllerClient;

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

    this.client = new ParameterControllerClient(this.transport);
  }

  async getTrackParameters(trackId: number): Promise<ParameterInfoList> {
    const { response } = await this.client.getTrackParameters(
      TrackIdentifier.create({ id: trackId })
    );
    return response;
  }

  async getProcessorParameters(processorId: number): Promise<ParameterInfoList> {
    const { response } = await this.client.getProcessorParameters(
      ProcessorIdentifier.create({ id: processorId })
    );
    return response;
  }

  async getParameterId(request: ParameterIdRequest): Promise<ParameterIdentifier> {
    const { response } = await this.client.getParameterId(request);
    return response;
  }

  async getParameterInfo(parameterId: ParameterIdentifier): Promise<ParameterInfo> {
    const { response } = await this.client.getParameterInfo(parameterId);
    return response;
  }

  async getParameterValue(parameterId: ParameterIdentifier): Promise<number> {
    const { response } = await this.client.getParameterValue(parameterId);
    return response.value;
  }

  async getParameterValueInDomain(parameterId: ParameterIdentifier): Promise<number> {
    const { response } = await this.client.getParameterValueInDomain(parameterId);
    return response.value;
  }

  async getParameterValueAsString(parameterId: ParameterIdentifier): Promise<string> {
    const { response } = await this.client.getParameterValueAsString(parameterId);
    return response.value;
  }

  async setParameterValue(processorId: number, parameterId: number, value: number): Promise<void> {
    const request = ParameterValue.create({
      parameter: ParameterIdentifier.create({ processorId, parameterId }),
      value,
    });
    await this.client.setParameterValue(request);
  }

  async getTrackProperties(trackId: number): Promise<PropertyInfoList> {
    const { response } = await this.client.getTrackProperties(
      TrackIdentifier.create({ id: trackId })
    );
    return response;
  }

  async getProcessorProperties(processorId: number): Promise<PropertyInfoList> {
    const { response } = await this.client.getProcessorProperties(
      ProcessorIdentifier.create({ id: processorId })
    );
    return response;
  }

  async getPropertyId(request: PropertyIdRequest): Promise<PropertyIdentifier> {
    const { response } = await this.client.getPropertyId(request);
    return response;
  }

  async getPropertyInfo(propertyId: PropertyIdentifier): Promise<PropertyInfo> {
    const { response } = await this.client.getPropertyInfo(propertyId);
    return response;
  }

  async getPropertyValue(propertyId: PropertyIdentifier): Promise<string> {
    const { response } = await this.client.getPropertyValue(propertyId);
    return response.value;
  }

  async setPropertyValue(processorId: number, propertyId: number, value: string): Promise<void> {
    const request = PropertyValue.create({
      property: PropertyIdentifier.create({ processorId, propertyId }),
      value,
    });
    await this.client.setPropertyValue(request);
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

export default SushiParameterController;
