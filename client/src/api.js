import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "/api" : "http://localhost:5000/api"),
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("sportify-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getErrorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.status >= 500) return "Sportify's API hit an unexpected server error. Check the server terminal and try again.";
  if (axios.isAxiosError(error) && !error.response) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return "Sportify server took too long to respond. Check the API and database, then try again.";
    }
    return "Cannot reach the Sportify API. Start the app with npm run dev and check the API address. If the API fails to start, allow your current IP in MongoDB Atlas → Network Access.";
  }
  return error.message || "Something went wrong. Please try again.";
}

export function getAssetUrl(path) {
  if (!path) return "";
  return new URL(path, new URL(api.defaults.baseURL, window.location.origin).origin).toString();
}

export default api;
