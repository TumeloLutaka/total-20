import { initializeSocketHandler } from "./socketHandler.js";
import { handleActionStream } from "./actionHandler.js";

initializeSocketHandler(handleActionStream);
