const sw = self as any;

sw.addEventListener("push", (event: any) => {
    if (!event.data) return;

    const { title, body, url } = event.data.json();

    event.waitUntil(
        sw.registration.showNotification(title, {
            body,
            icon: "/icons/icon-192x192.png",
            badge: "/icons/badge-72x72.png",
            data: { url },
        })
    );
});

sw.addEventListener("notificationclick", (event: any) => {
    event.notification.close();

    const url = event.notification.data?.url ?? "/";

    event.waitUntil(
        sw.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList: any[]) => {
                for (const client of clientList) {
                    if (client.url.includes(url) && "focus" in client) {
                        return client.focus();
                    }
                }
                return sw.clients.openWindow(url);
            })
    );
});