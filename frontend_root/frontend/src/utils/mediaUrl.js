import { API_BASE_URL } from "../config/api";

export function mediaUrl(path)
{
    if (!path)
    {
        return null;
    }
    return `${API_BASE_URL}${path}`;
}