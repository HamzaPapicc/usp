import { API_BASE_URL } from "../config/api";

export function apiUrl(path)
{
    return `${API_BASE_URL}${path}`;
}