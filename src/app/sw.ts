import { defaultCache } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist, NetworkOnly } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
    __SW_MANIFEST: Array<PrecacheEntry | string>;
};


const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    precacheOptions: {
        cleanupOutdatedCaches: true,
    },
    runtimeCaching: [
        {
            matcher: ({ url }: { url: URL }) => url.pathname.startsWith("/api/"),
            handler: new NetworkOnly(),
        },
        ...defaultCache,
    ],
});

serwist.addEventListeners();
