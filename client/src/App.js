import { useEffect, useState } from "react";
import axios from "./utils/axios";
import "./maxiGame";

function App() {
  const [loginLoading, setLoginLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(false);

  // function setCookie(name, value, daysToLive) {
  //   const date = new Date();
  //   date.setTime(date.getTime() + daysToLive * 24 * 60 * 60 * 1000);
  //   let expires = "expires=" + date.toUTCString();
  //   document.cookie = `${name}=${value}; ${expires}; path=/`;
  // }

  const getCookie = (name) => {
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`))
        ?.split("=")[1] ?? null
    );
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        setUserLoading(true);

        const token = getCookie("user_token");

        if (!token) {
          setUserLoading(false);
          return;
        }

        // Отправляем токен в заголовке авторизации
        const response = await axios.post("/user/auth", {
          user_token: getCookie("user_token"),
        });

        if (response.status === 200) {
          setUserData(response.data);
        }

        console.log(userData);
      } catch (err) {
        console.log(err);
        // alert("Не удалось получить пользователя");
      } finally {
        setUserLoading(false);
      }
    };

    getUser();
  }, []);

  return (
    <div className="App">
      <button onClick={() => window.MaxiGame.closeGame()}>Закрыть игру</button>
      <button
        onClick={() => window.MaxiGame.activatePromoCode("YOUR_PROMO_CODE")}
      >
        Активировать промокод
      </button>

      <p>Токен: {getCookie("user_token")}</p>
      <p>Число попыток: {userData?.total_attempts}</p>
    </div>
  );
}

export default App;
