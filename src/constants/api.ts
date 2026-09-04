const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:3113/api";

export const API_BASE_URL = `${API_URL}/products`;
export const API_AUTH_URL = API_URL;
