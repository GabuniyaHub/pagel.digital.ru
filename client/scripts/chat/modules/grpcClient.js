import grpc from "@grpx/grpx.js";
import protoLoader from "@grpx/protoloader.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(__dirname, "../proto/chat.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const chatPackage = grpcObject.chat;

const client = new chatPackage.ChatService("avtocond-ugra.ru:50051", grpc.credentials.createInsecure());

export default client;