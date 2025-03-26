import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import {
    SessionControllerClient,
    ParameterControllerClient,
    TransportControllerClient,
    NotificationControllerClient,
    AudioGraphControllerClient,
} from "@/proto/sushi/sushi_rpc.client";
import {
    GenericVoidValue,
    ParameterIdentifier,
    ProcessorIdentifier,
    ParameterUpdate,
    TransportUpdate,
    ParameterValue,
    GenericFloatValue,
    ParameterNotificationBlocklist,
    SessionState,
} from "@/proto/sushi/sushi_rpc";
import type { RpcInterceptor, RpcOptions, UnaryCall } from "@protobuf-ts/runtime-rpc";

const addTeHeaderInterceptor: RpcInterceptor = {
    interceptUnary(next, method, input, options): UnaryCall<any, any> {
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

const sushiTransport = new GrpcWebFetchTransport({
    baseUrl: "http://localhost:8080/sushi",
    interceptors: [addTeHeaderInterceptor],
});

const sessionClient = new SessionControllerClient(sushiTransport);
const parameterNotificationClient = new NotificationControllerClient(sushiTransport);
const transportClient = new TransportControllerClient(sushiTransport);
const parameterClient = new ParameterControllerClient(sushiTransport);
const audioGraphClient = new AudioGraphControllerClient(sushiTransport);

/**
 * Save the current Sushi session.
 */
const saveSession = async (): Promise<void> => {
    try {
        const response = await sessionClient.saveSession(GenericVoidValue.create());
        console.log("Session saved successfully:", response.response);
    } catch (error) {
        console.error("Failed to save session:", error);
    }
};

/**
 * Restore the last saved Sushi session.
 */
const restoreSession = async (sessionState: SessionState): Promise<void> => {
    try {
        const response = await sessionClient.restoreSession(sessionState);
        console.log("Session restored successfully:", response.response);
    } catch (error) {
        console.error("Failed to restore session:", error);
    }
};

/**
 * Stream live parameter updates.
 */
const streamParameterUpdates = (
    onUpdate: (update: ParameterUpdate) => void,
    onError: (error: any) => void
): (() => void) => {
    console.log("Starting parameter updates stream...");
    const stream = parameterNotificationClient.subscribeToParameterUpdates(ParameterNotificationBlocklist.create());

    let active = true; // Flag to control the stream

    const processStream = async () => {
        try {
            console.log("Processing parameter updates stream...");
            for await (const update of stream.responses) {
                if (!active) {
                    console.log("Stream flagged as inactive, stopping processing.");
                    break;
                }
                console.log("Received raw parameter update:", update); // Log raw update data

                // Add checks to ensure the update contains expected data
                if (!update.parameter) {
                    console.warn("Received update with no parameter information:", update);
                    continue;
                }

                if (update.parameter.processorId === undefined || update.parameter.parameterId === undefined) {
                    console.warn("Parameter update missing processorId or parameterId:", update);
                    continue;
                }

                console.log(
                    `Processing update for processorId=${update.parameter.processorId}, parameterId=${update.parameter.parameterId}, normalizedValue=${update.normalizedValue}`
                );

                // Call the onUpdate callback with the update
                onUpdate(update);
            }
        } catch (error) {
            console.error("Stream error occurred during parameter updates:", error);
            onError(error);
        } finally {
            console.log("Stream processing completed.");
        }
    };

    // Start processing the stream
    processStream().catch((error) => {
        console.error("Unexpected error while processing the stream:", error);
    });

    // Return a cleanup function to stop the stream
    return () => {
        console.log("Stopping parameter updates stream...");
        active = false; // Flag to stop processing the stream
    };
};

/**
 * Stream BPM and transport updates.
 */
const streamBpmUpdates = (
    onUpdate: (update: TransportUpdate) => void,
    onError: (error: any) => void
): (() => void) => {
    // Create the streaming call using the client
    const stream = parameterNotificationClient.subscribeToTransportChanges(GenericVoidValue.create());

    // Subscribe to the stream's messages
    const onMessageSubscription = stream.responses.onMessage((update: TransportUpdate) => {
        console.log("Received TransportUpdate:", update); // Debug log for updates
        onUpdate(update);
    });

    // Subscribe to the stream's errors
    const onErrorSubscription = stream.responses.onError((error: any) => {
        console.error("Stream error in TransportUpdates:", error); // Debug log for errors
        onError(error);
    });

    // Return a cleanup function
    return () => {
        onMessageSubscription(); // Unsubscribe from messages
        onErrorSubscription(); // Unsubscribe from errors
    };
};

/**
 * Fetch the current value of a specific parameter in Sushi.
 */
const fetchParameterValue = async (processorId: number, parameterId: number): Promise<number> => {
    try {
        const response = await parameterClient.getParameterValue(
        ParameterIdentifier.create({ processorId, parameterId })
        );
        console.log(`Fetched parameter value: processorId=${processorId}, parameterId=${parameterId}, value=${response.response.value}`);
        return response.response.value;
    } catch (err) {
        console.error(`Failed to fetch parameter value for processorId=${processorId}, parameterId=${parameterId}:`, err);
        throw err;
    }
};

/**
 * Fetch all active plugins and their parameters.
 */
const fetchPlugins = async () => {
    const response = await audioGraphClient.getAllProcessors(GenericVoidValue.create());
    return await Promise.all(
        response.response.processors.map(async (processor) => {
            const paramResponse = await parameterClient.getProcessorParameters(
                ProcessorIdentifier.create({ id: processor.id })
            );
            const parameters = await Promise.all(
                paramResponse.response.parameters.map(async (param) => {
                    const valueResponse = await parameterClient.getParameterValue(
                        ParameterIdentifier.create({
                            processorId: processor.id,
                            parameterId: param.id,
                        })
                    );
                    return {
                        id: param.id,
                        name: param.name,
                        value: valueResponse.response.value,
                        min: param.minDomainValue,
                        max: param.maxDomainValue,
                    };
                })
            );
            return { id: processor.id, name: processor.name, parameters };
        })
    );
};

/**
 * Update a specific parameter in Sushi.
 */
const updateParameter = async (
    parameterId: { processorId: number; parameterId: number },
    value: number
): Promise<void> => {
    const request = ParameterValue.create({
        parameter: ParameterIdentifier.create(parameterId),
        value,
    });

    try {
        const response = await parameterClient.setParameterValue(request);
        console.log("Parameter update response:", response);
    } catch (err) {
        console.error("Failed to update parameter:", err);
    }
};

/**
 * Fetch BPM and transport settings.
 */
const fetchTransportSettings = async () => {
    const bpmResponse = await transportClient.getTempo(GenericVoidValue.create());
    const playingModeResponse = await transportClient.getPlayingMode(GenericVoidValue.create());
    return { bpm: bpmResponse.response.value, playingMode: playingModeResponse.response.mode };
};

/**
 * Update the BPM value in Sushi.
 */
const updateBpm = async (newBpm: number) => {
    try {
        const response = await transportClient.setTempo(GenericFloatValue.create({ value: newBpm }));
        console.log("BPM updated successfully:", response);
    } catch (err) {
        console.error("Failed to update BPM:", err);
    }
};

const sushiStore = {
    fetchPlugins,
    fetchTransportSettings,
    updateParameter,
    updateBpm,
    saveSession,
    restoreSession,
    streamParameterUpdates,
    streamBpmUpdates,
    fetchParameterValue,
};

export default sushiStore;
