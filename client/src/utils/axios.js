import axios from "axios";

const getCookie = (name) => {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1] ?? null
  );
};

const instance = axios.create({
  baseURL: process.env.REACT_APP_SERVER_URL,
});

instance.interceptors.request.use((config) => {
  config.headers.Authorization = getCookie("token");

  return config;
});

export default instance;