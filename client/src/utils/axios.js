import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_SERVER_URL,
});

instance.interceptors.request.use((config) => {
  config.headers.Authorization =
    "9trg3XDQtOeHbF3ZYwKPBqeGZ2fp6p0rkEkmHfedW8ftmCO2hoJ2IHsRjCZx3Fo";

  return config;
});

export default instance;
