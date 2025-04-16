// import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
// import {
//     Empty,
//     ConfigName,
// } from "@/proto/main-app/main_app";
// import { MainAppClient } from "@/proto/main-app/main_app.client";
// import type { RpcInterceptor, RpcOptions, UnaryCall } from "@protobuf-ts/runtime-rpc";

// const addTeHeaderInterceptor: RpcInterceptor = {
//     interceptUnary(next, method, input, options): UnaryCall<any, any> {
//         const updatedOptions: RpcOptions = {
//             ...options,
//             meta: {
//                 ...options?.meta,
//                 TE: "trailers",
//             },
//         };
//         return next(method, input, updatedOptions);
//     },
// };

// const mainAppTransport = new GrpcWebFetchTransport({
//     baseUrl: "http://localhost:8080/main-app",
//     interceptors: [addTeHeaderInterceptor],
// });

// const mainAppClient = new MainAppClient(mainAppTransport);

// // Fetch connection status
// const fetchConnectionStatus = async (): Promise<{ message: string; connected: boolean }> => {
//     const response = await mainAppClient.checkConnection(Empty.create());
//     return response.response;
// };

// // Fetch available configurations
// const fetchConfigList = async (): Promise<string[]> => {
//     const response = await mainAppClient.fetchConfigFiles(Empty.create());
//     console.log("Raw response from fetchConfigFiles:", response.response);
//     return response.response.configs || [];
//   };

// // Load a specific configuration
// const loadConfig = async (configName: string): Promise<{ message: string; success: boolean }> => {
//     const request = ConfigName.create({ name: configName });
//     const response = await mainAppClient.useConfigFile(request);
//     return response.response;
// };

// const mainAppStore = {
//     fetchConnectionStatus,
//     fetchConfigList,
//     loadConfig,
// };

// export default mainAppStore;
