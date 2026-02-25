import type { InsertPostPayload } from "../types";

export type MessageFromUI =
  | { type: "INSERT_POSTS"; payload: { posts: InsertPostPayload[] } };

export type MessageFromMain =
  | { type: "INSERT_DONE"; count: number }
  | { type: "INSERT_ERROR"; error: string };

export function sendToMain(message: MessageFromUI): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

export function onMainMessage(cb: (message: MessageFromMain) => void): void {
  window.onmessage = (event: MessageEvent) => {
    const msg = event.data?.pluginMessage;
    if (msg && (msg.type === "INSERT_DONE" || msg.type === "INSERT_ERROR")) {
      cb(msg as MessageFromMain);
    }
  };
}
