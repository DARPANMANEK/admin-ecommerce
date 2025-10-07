import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_BASE_URL = "http://localhost:4000/api";

export const API_BASE_URL =
  import.meta?.env?.REACT_PUBLIC_API_URL ||
  import.meta?.env?.VITE_PUBLIC_API_URL ||
  DEFAULT_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem("token");
  }
}

// attach interceptor to include token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Supabase client for signed uploads
let viteEnv = {};
try {
  // Access Vite env if available
  // eslint-disable-next-line no-undef
  viteEnv = (import.meta && import.meta.env) || {};
} catch (_) {
  viteEnv = {};
}

export let SUPABASE_URL =
  viteEnv.VITE_PUBLIC_SUPABASE_URL ||
  (typeof window !== "undefined" &&
    (window.VITE_PUBLIC_SUPABASE_URL || window.SUPABASE_URL)) ||
  "";
export let SUPABASE_ANON_KEY =
  viteEnv.VITE_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof window !== "undefined" &&
    (window.VITE_PUBLIC_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY)) ||
  "";

export let SUPABASE_BUCKET =
  viteEnv.VITE_PUBLIC_SUPABASE_BUCKET ||
  (typeof window !== "undefined" &&
    (window.VITE_PUBLIC_SUPABASE_BUCKET || window.SUPABASE_BUCKET)) ||
  "interview";

let supabaseInternal =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export const supabase = supabaseInternal;
export const isSupabaseConfigured = Boolean(supabaseInternal);

export function setSupabaseConfig({ url, anonKey, bucket }) {
  if (typeof url === "string") SUPABASE_URL = url;
  if (typeof anonKey === "string") SUPABASE_ANON_KEY = anonKey;
  if (typeof bucket === "string") SUPABASE_BUCKET = bucket;
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseInternal = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}

export async function uploadImageViaSignedUrl(file) {
  if (!file) return null;
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Max 5MB");
  }
  if (!supabase) throw new Error("Supabase not configured");

  const signRes = await api.post("/uploads/sign", {
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
  });
  const { token, objectPath, publicUrl, bucket } = signRes.data || {};
  if (!token || !objectPath) throw new Error("Failed to get signed token");

  const targetBucket = bucket || SUPABASE_BUCKET || "interview";

  const { error } = await supabase.storage
    .from(targetBucket)
    .uploadToSignedUrl(objectPath, token, file, {
      contentType: file.type || "application/octet-stream",
    });
  if (error) throw error;
  // Compute a clean public URL from Supabase client (ignores any server-provided URL)
  const { data } = supabase.storage.from(targetBucket).getPublicUrl(objectPath);
  return data?.publicUrl || publicUrl || "";
}
