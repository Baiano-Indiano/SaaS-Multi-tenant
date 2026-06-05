import Pusher from "pusher";

const globalForPusher = globalThis as unknown as {
  pusherServer: Pusher | undefined;
};

export const pusherServer =
  globalForPusher.pusherServer ??
  new Pusher({
    appId: process.env.PUSHER_APP_ID || "pusher-app-id",
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "pusher-app-key",
    secret: process.env.PUSHER_SECRET || "pusher-secret",
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
    useTLS: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPusher.pusherServer = pusherServer;
}
