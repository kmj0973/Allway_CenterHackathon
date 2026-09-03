import axios from "axios";

import { ACCESS_TOKEN_STORAGE_KEY } from "@/constants/storageKey";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

    if (config.data instanceof FormData) {
      config.headers.delete("Content-Type");
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/*
  개발 환경에서 VITE_RECORD_API=true 일 때만 실제 응답을 수집한다.
  동적 import라 프로덕션 번들에는 포함되지 않는다.
*/
if (import.meta.env.DEV && import.meta.env.VITE_RECORD_API === "true") {
  void import("@/mocks/apiRecorder").then(({ setupApiRecorder }) =>
    setupApiRecorder(axiosInstance),
  );
}

export default axiosInstance;
