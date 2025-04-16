// import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
// import { KeyboardControllerClient } from "@/proto/sushi/sushi_rpc.client";
// import { NoteOnRequest, NoteOffRequest } from "@/proto/sushi/sushi_rpc";

// const transport = new GrpcWebFetchTransport({
//   baseUrl: "http://localhost:8080/sushi",
// });

// const keyboardClient = new KeyboardControllerClient(transport);

// const sendNoteOn = async (note: number, velocity: number) => {
//   try {
//     const request = NoteOnRequest.create({ note, velocity });
//     await keyboardClient.sendNoteOn(request);
//   } catch (error) {
//     console.error("Failed to send NoteOn:", error);
//   }
// };

// const sendNoteOff = async (note: number) => {
//   try {
//     const request = NoteOffRequest.create({ note });
//     await keyboardClient.sendNoteOff(request);
//   } catch (error) {
//     console.error("Failed to send NoteOff:", error);
//   }
// };

// export default {
//   sendNoteOn,
//   sendNoteOff,
// };
