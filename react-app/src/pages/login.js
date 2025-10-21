import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ⬅️ вот это важно
import axios from "axios";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("email");

  const navigate = useNavigate(); // ⬅️ вот здесь

  const handleSendCode = async () => {
    if (!["fox78907864@gmail.com"].includes(email)) {
      alert("Нет доступа");
      return;
    }

    await axios.post("/admin/send-admin", { email });
    setStep("code");
  };

  const handleVerifyCode = async () => {
    const res = await axios.post("/api/verify-admin", { email, code });
    const { token } = res.data;

    sessionStorage.setItem("jwt", token);
    sessionStorage.setItem("email", email);

    onLogin();
    navigate("/"); // ⬅️ вот это отправит пользователя на Dashboard
  };

  return (
    <div style={{ padding: "30px" }}>
      {step === "email" ? (
        <>
          <h2>Вход для администратора</h2>
          <input placeholder="Введите email" value={email} onChange={e => setEmail(e.target.value)} />
          <button onClick={handleSendCode}>Отправить код</button>
        </>
      ) : (
        <>
          <h2>Код отправлен на {email}</h2>
          <input placeholder="Введите код" value={code} onChange={e => setCode(e.target.value)} />
          <button onClick={handleVerifyCode}>Подтвердить</button>
        </>
      )}
    </div>
  );
};

export default Login;
