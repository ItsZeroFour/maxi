const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function getToken() {
  return localStorage.getItem("admin_token");
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("admin_token");
    window.location.reload();
    throw new Error("Не авторизован");
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Ошибка запроса");
  }

  return data;
}

async function downloadFile(path, fallbackFilename) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("admin_token");
    window.location.reload();
    throw new Error("Не авторизован");
  }

  if (!res.ok) {
    let message = "Ошибка запроса";
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {
      // ignore, response wasn't JSON
    }
    throw new Error(message);
  }

  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : fallbackFilename;

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export const api = {
  login: (login, password) =>
    request("/admin/login", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    }),

  getUsers: (page = 1, limit = 20, search = "") =>
    request(
      `/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    ),

  getUserDetails: (token) =>
    request(`/admin/users/${encodeURIComponent(token)}`),

  getUserLogs: (token) =>
    request(`/admin/users/${encodeURIComponent(token)}/logs`),

  getLevelsStats: () => request("/admin/stats/levels"),

  getPromocodesStats: () => request("/admin/stats/promocodes"),

  getOverview: () => request("/admin/stats/overview"),

  updateUser: (token, payload) =>
    request(`/admin/users/${encodeURIComponent(token)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  exportUsersCsv: () =>
    downloadFile("/admin/users/export/csv", "users.csv"),
};