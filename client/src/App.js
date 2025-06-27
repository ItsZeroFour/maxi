import { useEffect, useState } from "react";
import axios from "./utils/axios";

function App() {
  const [loginLoading, setLoginLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(false);

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

        window.localStorage.setItem("token", response.data.user_token);
        setLoginLoading(false);
      }
    } catch (err) {
      console.log(err);
      setLoginLoading(false);
      alert("Не удалось войти");
    }
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        setUserLoading(true);
        const response = await axios.get(
          `/user/get?user_token=${window.localStorage.getItem("token")}`
        );

        setUserLoading(false);

        if (response.status === 200) {
          setUserData(response.data);
        }
      } catch (err) {
        setUserLoading(false);
        console.log(err);
      }
    };

    getUser();
  }, []);

  const incAttempts = async () => {
    try {
      setUserData(prev => ({
        ...prev,
        total_attempts: prev.total_attempts + 1
      }));

      const response = await axios.patch("/user/update-attempts", {
        attempts: [
          {
            user_token: userData.user_token,
            count: 1,
          },
        ],
      });

    if (response.data.success) {
      const hasErrors = response.data.errors?.some(
        error => error.user_token === userData.user_token
      );
      
      if (hasErrors) {
        setUserData(prev => ({
          ...prev,
          total_attempts: prev.total_attempts - 1
        }));
        alert("Не удалось увеличить попытки на сервере");
      } else {
        const userResponse = await axios.get(`/user/get?user_token=${userData.user_token}`);
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
            <p>Кол-во попыток: {userData.total_attempts}</p>

            <button onClick={incAttempts}>Увеличить попытку (на 1)</button>
          </>
        )
      )}
    </div>
  );
}

export default App;
