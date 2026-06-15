import { apiFetch } from "./apiFetch"
import { apiUrl } from "./apiUrl";

export function getCSRFToken()
{
    return document.cookie
    .split("; ")
    .find(row => row.startsWith("csrftoken="))
    ?.split("=")[1]
}

export async function ensureCSRF()
{
    if (getCSRFToken()) return;
    const response = await fetch(apiUrl("/api/csrf/"), {
        method: "GET",
        credentials: "include"
    });
    if (!response.ok)
    {
        throw new Error("Failed to obtain CSRF token");
    }
}