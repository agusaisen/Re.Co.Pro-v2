export async function apiRequest(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token")

  if (!token) {
    throw new Error("No authentication token found")
  }

  // Parse the token to get session data
  let sessionData
  try {
    sessionData = JSON.parse(token)
  } catch {
    throw new Error("Invalid token format")
  }

  const headers: Record<string, string> = {
    "x-session-data": token, // Send the full token as session data
    ...options.headers,
  }

  // Only set Content-Type to application/json if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
