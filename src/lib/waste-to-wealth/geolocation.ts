export function getCurrentGeo(options?: { timeoutMs?: number }) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("Geolocation not supported"));
  }

  const timeoutMs = options?.timeoutMs ?? 8000;
  return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error("Geolocation timeout")), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(t);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        window.clearTimeout(t);
        reject(err);
      },
      { enableHighAccuracy: false, maximumAge: 30000 },
    );
  });
}

