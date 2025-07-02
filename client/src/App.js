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

  /**
   * Получает значение cookie по имени
   * @param {string} name - Имя cookie
   * @returns {string|null} Значение cookie или null, если не найдено
   */
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
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
      }

      setLoginLoading(true);
      const response = await axios.post("/user/auth", { user_token: result });

      if (response.status === 200) {
        alert(`Вы успешно вошли! Токен: ${response.data.user_token}`);

        setUserData(response.data);

        setCookie("token", response.data.user_token, 7);
        setLoginLoading(false);
      }
    } catch (err) {
      console.log(err);
      setLoginLoading(false);
      alert("Не удалось войти");
    }
  };

  useEffect(() => {
    let isMounted = true; // Флаг монтирования компонента
    const controller = new AbortController(); // способ отмены запросов

    const fetchUserData = async () => {
      try {
        setUserLoading(true);

        const token = getCookie("token");
        if (!token) {
          throw new Error("Токен не найден");
        }

        const response = await axios.get("/user/get", {
          params: { user_token: token },
          signal: controller.signal,
        });

        if (isMounted && response.data) {
          setUserData(response.data);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Ошибка:", error.message);
        }
      } finally {
        if (isMounted) {
          setUserLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
      controller.abort(); // Отмена запроса при размонтировании
    };
  }, []);

  const incAttempts = async () => {
    try {
      setUserData((prev) => ({
        ...prev,
        total_attempts: prev.total_attempts + 1,
      }));

      const response = await axios.patch("/user/addAttempts", {
        attempts: [
          {
            user_token: userData.user_token,
            count: 1,
          },
        ],
      });

      if (response.data.success) {
        const hasErrors = response.data.errors?.some(
          (error) => error.user_token === userData.user_token
        );

        if (hasErrors) {
          setUserData((prev) => ({
            ...prev,
            total_attempts: prev.total_attempts - 1,
          }));
          alert("Не удалось увеличить попытки на сервере");
        } else {
          const userResponse = await axios.get(
            `/user/get?user_token=${userData.user_token}`
          );
          setUserData(userResponse.data);
        }
      }
    } catch (err) {
      console.log(err);
      alert("Не удалось увеличить попытку");
    }
  };

  return (
    <div className="App">
      {loginLoading ? (
        <p>Загрузка...</p>
      ) : (
        <>
          {" "}
          <p>Кнопка генерирует рандомный user_token</p>
          <button onClick={login}>Войти</button>
        </>
      )}

      {userLoading ? (
        <p>Загрузка пользователя...</p>
      ) : (
        userData && (
          <>
            <p>user_id: {userData.user_token}</p>
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
