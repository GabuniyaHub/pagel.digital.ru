import React, { useEffect, useState } from "react";
import axios from "axios";

const CURRENT_USER_ROLE = "owner"; // временно, потом будем брать из БД

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem("jwt");

    // Загружаем пользователей
    const fetchUsers = async () => {
      try {
        const res = await axios.get("/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Ошибка при загрузке пользователей:", err);
      }
    };

    // Загружаем объявления
    const fetchListings = async () => {
      try {
        const res = await axios.get("/admin/listings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setListings(res.data);
      } catch (err) {
        console.error("Ошибка при загрузке объявлений:", err);
      }
    };

    fetchUsers();
    fetchListings();
  }, []);

  // ==== Пользователи ====

  const deleteUser = async (userId) => {
    if (!window.confirm("Ты уверен, что хочешь удалить пользователя?")) return;
    const token = sessionStorage.getItem("jwt");
    try {
      await axios.delete(`/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error("Ошибка при удалении пользователя:", err);
    }
  };

  const toggleBlockUser = async (userId, isBlocked) => {
    const token = sessionStorage.getItem("jwt");
    try {
      await axios.patch(
        `/admin/users/${userId}/block`,
        { isBlocked: !isBlocked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, isBlocked: !isBlocked } : u))
      );
    } catch (err) {
      console.error("Ошибка при блокировке пользователя:", err);
    }
  };

  // ==== Листинги ====

  const deleteListing = async (listingId) => {
    if (!window.confirm("Удалить это объявление?")) return;
    const token = sessionStorage.getItem("jwt");
    try {
      await axios.delete(`/admin/listings/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setListings(prev => prev.filter(l => l.id !== listingId));
    } catch (err) {
      console.error("Ошибка при удалении объявления:", err);
    }
  };

  const toggleBlockListing = async (listingId, isBlocked) => {
    const token = sessionStorage.getItem("jwt");
    try {
      await axios.patch(
        `/admin/listings/${listingId}/block`,
        { isBlocked: !isBlocked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setListings(prev =>
        prev.map(l => (l.id === listingId ? { ...l, isBlocked: !isBlocked } : l))
      );
    } catch (err) {
      console.error("Ошибка при блокировке объявления:", err);
    }
  };

  const editListing = (listingId) => {
    alert(`Открыть форму редактирования для объявления ID: ${listingId}`);
    // Тут можно сделать переход на страницу /admin/listings/edit/:id
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* === Пользователи === */}
      <h2>Пользователи</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
        {users.map(u => (
          <div key={u.id} style={{ border: "1px solid #ccc", borderRadius: "10px", padding: "10px" }}>
            <h4>{u.email}</h4>
            <p>ID: {u.id}</p>
            {CURRENT_USER_ROLE === "owner" && (
              <button
                style={{ backgroundColor: "#e74c3c", color: "white", border: "none", padding: "6px", borderRadius: "5px", cursor: "pointer", marginRight: "5px" }}
                onClick={() => deleteUser(u.id)}
              >
                Удалить
              </button>
            )}
            <button
              style={{
                backgroundColor: u.isBlocked ? "#2ecc71" : "#f39c12",
                color: "white",
                border: "none",
                padding: "6px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              onClick={() => toggleBlockUser(u.id, u.isBlocked)}
            >
              {u.isBlocked ? "Разблокировать" : "Заблокировать"}
            </button>
          </div>
        ))}
      </div>

      {/* === Листинги === */}
      <h2 style={{ marginTop: "40px" }}>Объявления</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
        {listings.map(l => (
          <div key={l.id} style={{ border: "1px solid #ccc", borderRadius: "10px", padding: "10px" }}>
            <h4>{l.title}</h4>
            <p>ID: {l.id}</p>
            <p>Автор: {l.user_id}</p>
            <p>Статус: {l.isBlocked ? "Заблокировано" : "Активно"}</p>
            <button
              style={{ backgroundColor: "#3498db", color: "white", border: "none", padding: "6px", borderRadius: "5px", cursor: "pointer", marginRight: "5px" }}
              onClick={() => editListing(l.id)}
            >
              Редактировать
            </button>
            <button
              style={{ backgroundColor: "#e74c3c", color: "white", border: "none", padding: "6px", borderRadius: "5px", cursor: "pointer", marginRight: "5px" }}
              onClick={() => deleteListing(l.id)}
            >
              Удалить
            </button>
            <button
              style={{
                backgroundColor: l.isBlocked ? "#2ecc71" : "#f39c12",
                color: "white",
                border: "none",
                padding: "6px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              onClick={() => toggleBlockListing(l.id, l.isBlocked)}
            >
              {l.isBlocked ? "Разблокировать" : "Заблокировать"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
