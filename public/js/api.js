const Api = (() => {
  const TOKEN_KEY = "belvedere_admin_token";

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }
  function setToken(token) {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  async function request(path, { method = "GET", body, isForm = false } = {}) {
    const headers = {};
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;
    if (!isForm && body !== undefined) headers["Content-Type"] = "application/json";

    const res = await fetch("/api" + path, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });

    let data = null;
    try { data = await res.json(); } catch (e) { /* pas de corps JSON */ }

    if (!res.ok) {
      const message = (data && data.error) || `Erreur ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  return {
    getToken,
    setToken,
    get: (path) => request(path),
    post: (path, body) => request(path, { method: "POST", body }),
    put: (path, body) => request(path, { method: "PUT", body }),
    del: (path) => request(path, { method: "DELETE" }),
    upload: async (file) => {
      const form = new FormData();
      form.append("file", file);
      return request("/uploads", { method: "POST", body: form, isForm: true });
    },
  };
})();
