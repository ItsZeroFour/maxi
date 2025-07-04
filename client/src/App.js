import { useEffect, useState } from "react";
import axios from "./utils/axios";

function App() {
  const [loginLoading, setLoginLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(false);

  function setCookie(name, value, daysToLive) {
    const date = new Date();
    date.setTime(date.getTime() + daysToLive * 24 * 60 * 60 * 1000);
    let expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${value}; ${expires}; path=/`;
  }

  const getCookie = (name) => {
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`))
        ?.split("=")[1] ?? null
    );
  };

  const login = async () => {
    try {
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      for (let i = 0; i < 6; i++) {
        result += characters[Math.floor(Math.random() * characters.length)];
      }

      setLoginLoading(true);
      // В запросе отправляем user_id вместо user_token
      const response = await axios.post("/user/auth", { user_id: result });

      console.log(response);

      if (response.status === 200) {
        const { token, ...user } = response.data;
        setCookie("token", token, 7);
        setUserData(user);
        alert(`Вы успешно вошли!`);
      }
    } catch (err) {
      console.log(err);
      alert("Не удалось войти");
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        setUserLoading(true);

        const token = getCookie("token");
        if (!token) {
          setUserLoading(false);
          return;
        }

        // Отправляем токен в заголовке авторизации
        const response = await axios.get("/user/get", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          setUserData(response.data);
        }
      } catch (err) {
        console.log(err);
        // alert("Не удалось получить пользователя");
      } finally {
        setUserLoading(false);
      }
    };

    getUser();
  }, []);

  const incAttempts = async () => {
    try {
      const token = getCookie("token");
      if (!token) return alert("Нет токена");

      setUserData((prev) => ({
        ...prev,
        total_attempts: prev.total_attempts + 1,
      }));

      // В запросе теперь передаём user_id вместо user_token, из userData
      const response = await axios.post(
        "/user/addAttempts",
        {
          attempts: [{ user_token: token, count: 1 }],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const hasErrors = response.data.errors?.length > 0;
        if (hasErrors) {
          setUserData((prev) => ({
            ...prev,
            total_attempts: prev.total_attempts - 1,
          }));
          alert("Не удалось увеличить попытки");
        } else {
          const userResponse = await axios.get("/user/get", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setUserData(userResponse.data);
        }
      }
    } catch (err) {
      console.log(err);
      alert("Ошибка при увеличении попыток");
    }
  };

  return (
    <div className="App">
      {loginLoading ? (
        <p>Загрузка...</p>
      ) : (
        <>
          <p>Кнопка генерирует рандомный user_id</p>
          <button onClick={login}>Войти</button>
        </>
      )}

      {userLoading ? (
        <p>Загрузка пользователя...</p>
      ) : (
        userData && (
          <>
            <p>user_id: {userData.user_id}</p>
            <p>токен: {getCookie("token")}</p>
            <p>Кол-во попыток: {userData.total_attempts}</p>
            <button onClick={incAttempts}>Увеличить попытку (на 1)</button>
          </>
        )
      )}
    </div>
  );
}

export default App;
