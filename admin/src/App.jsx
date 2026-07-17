import React, { useEffect, useState } from "react";
import { api } from "./api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const BOOSTER_COLORS = {
  impulse_line4_horizont: "#f5a623",
  impulse_line4_vertical: "#5eead4",
  vspyshka_line5: "#a78bfa",
  prizma_gt: "#fb7185",
};

const BOOSTER_LABELS = {
  impulse_line4_horizont: "Импульс гориз.",
  impulse_line4_vertical: "Импульс верт.",
  vspyshka_line5: "Вспышка x5",
  prizma_gt: "Призма GT",
};

function LoginScreen({ onLogin }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(login, password);
      localStorage.setItem("admin_token", data.token);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-eyebrow">MAXI · ADMIN</div>
        <h1>Вход в панель</h1>
        <label>
          Логин
          <input
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoFocus
          />
        </label>
        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <div className="login-error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? "Входим…" : "Войти"}
        </button>
      </form>
    </div>
  );
}

// ==================== ОБЗОР / ДАШБОРД ====================

function OverviewTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getOverview()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <div className="loading">Загрузка…</div>;

  const boosterTotalsData = Object.entries(data.boostersTotals).map(
    ([type, count]) => ({ type, count, label: BOOSTER_LABELS[type] }),
  );

  return (
    <div className="tab-content">
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-value">{data.totalUsers}</div>
          <div className="kpi-label">Всего пользователей</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{data.onboardedUsers}</div>
          <div className="kpi-label">Прошли онбординг</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{data.onboardingRate}%</div>
          <div className="kpi-label">Конверсия онбординга</div>
        </div>
      </div>

      <div className="panel">
        <h3>Регистрации по дням</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.registrationsByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262b36" />
            <XAxis dataKey="date" stroke="#8a92a6" fontSize={12} />
            <YAxis stroke="#8a92a6" fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "#171a21",
                border: "1px solid #262b36",
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#f5a623"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <h3>Начисление попыток по дням</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.attemptsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262b36" />
              <XAxis dataKey="date" stroke="#8a92a6" fontSize={11} />
              <YAxis stroke="#8a92a6" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#171a21",
                  border: "1px solid #262b36",
                }}
              />
              <Bar dataKey="count" fill="#5eead4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3>Бустеры на руках у игроков</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={boosterTotalsData}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => entry.count}
              >
                {boosterTotalsData.map((entry) => (
                  <Cell key={entry.type} fill={BOOSTER_COLORS[entry.type]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#171a21",
                  border: "1px solid #262b36",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8a92a6" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ==================== УРОВНИ ====================

function LevelsTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getLevelsStats()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <div className="loading">Загрузка…</div>;

  return (
    <div className="tab-content">
      <div className="panel">
        <h3>Проходимость по уровням ({data.totalUsers} игроков всего)</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data.levels}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262b36" />
            <XAxis dataKey="level" stroke="#8a92a6" fontSize={12} />
            <YAxis stroke="#8a92a6" fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "#171a21",
                border: "1px solid #262b36",
              }}
              formatter={(value, name) =>
                name === "completionRate"
                  ? [`${value}%`, "Прохождение"]
                  : [value, "Завершений"]
              }
            />
            <Bar dataKey="completions" fill="#f5a623" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Уровень</th>
              <th>Завершений</th>
              <th>% прохождения</th>
            </tr>
          </thead>
          <tbody>
            {data.levels.map((l) => (
              <tr key={l.level}>
                <td>{l.level}</td>
                <td>{l.completions}</td>
                <td>{l.completionRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== ПРОМОКОДЫ ====================

function PromocodesTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getPromocodesStats()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <div className="loading">Загрузка…</div>;

  return (
    <div className="tab-content">
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-value">{data.totalIssued}</div>
          <div className="kpi-label">Выдано промокодов</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{data.totalActivated}</div>
          <div className="kpi-label">Активировано</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{data.activationRate}%</div>
          <div className="kpi-label">Конверсия активации</div>
        </div>
      </div>

      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Промокод</th>
              <th>Выдано</th>
              <th>Активировано</th>
              <th>% активации</th>
            </tr>
          </thead>
          <tbody>
            {data.promocodes.map((p) => (
              <tr key={p.promocode}>
                <td className="mono">{p.promocode}</td>
                <td>{p.issued}</td>
                <td>{p.activated}</td>
                <td>
                  {p.issued > 0
                    ? ((p.activated / p.issued) * 100).toFixed(1)
                    : 0}
                  %
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== ПОЛЬЗОВАТЕЛИ ====================

function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    default_attempts: user.default_attempts,
    maxi_attempts: user.maxi_attempts,
    onbording_complete: user.onbording_complete,
    boosters: { ...user.boosters },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.updateUser(user.user_token, form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Редактирование: {user.user_token}</h3>

        <div className="modal-row">
          <label>
            Default attempts
            <input
              type="number"
              min="0"
              value={form.default_attempts}
              onChange={(e) =>
                setForm({ ...form, default_attempts: +e.target.value })
              }
            />
          </label>
          <label>
            Maxi attempts
            <input
              type="number"
              min="0"
              value={form.maxi_attempts}
              onChange={(e) =>
                setForm({ ...form, maxi_attempts: +e.target.value })
              }
            />
          </label>
        </div>

        <div className="modal-section-title">Бустеры</div>
        <div className="modal-row wrap">
          {Object.keys(BOOSTER_LABELS).map((type) => (
            <label key={type}>
              {BOOSTER_LABELS[type]}
              <input
                type="number"
                min="0"
                value={form.boosters[type] ?? 0}
                onChange={(e) =>
                  setForm({
                    ...form,
                    boosters: { ...form.boosters, [type]: +e.target.value },
                  })
                }
              />
            </label>
          ))}
        </div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.onbording_complete}
            onChange={(e) =>
              setForm({ ...form, onbording_complete: e.target.checked })
            }
          />
          Онбординг пройден
        </label>

        {error && <div className="login-error">{error}</div>}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  const load = () => {
    api
      .getUsers(page, 20, search)
      .then(setData)
      .catch((e) => setError(e.message));
  };

  useEffect(load, [page, search]);

  return (
    <div className="tab-content">
      <div className="panel">
        <div className="table-toolbar">
          <input
            className="search-input"
            placeholder="Поиск по user_token…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {data && <span className="table-total">Всего: {data.total}</span>}
        </div>

        {error && <div className="error-box">{error}</div>}
        {!data && !error && <div className="loading">Загрузка…</div>}

        {data && (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Токен</th>
                  <th>Попытки (deft/maxi)</th>
                  <th>Бустеры</th>
                  <th>Уровней пройдено</th>
                  <th>Промокоды (получ./актив.)</th>
                  <th>Онбординг</th>
                  <th>Регистрация</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.user_token}>
                    <td className="mono">{u.user_token}</td>
                    <td>
                      {u.default_attempts} / {u.maxi_attempts}
                    </td>
                    <td className="boosters-cell">
                      {Object.entries(u.boosters || {}).map(([type, count]) => (
                        <span
                          key={type}
                          className="booster-chip"
                          style={{ borderColor: BOOSTER_COLORS[type] }}
                          title={BOOSTER_LABELS[type]}
                        >
                          {count}
                        </span>
                      ))}
                    </td>
                    <td>{u.completed_levels_count}</td>
                    <td>
                      {u.promo_codes_count} / {u.activated_promo_codes_count}
                    </td>
                    <td>{u.onbording_complete ? "✓" : "—"}</td>
                    <td>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("ru-RU")
                        : "—"}
                    </td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => setEditingUser(u)}
                      >
                        Изменить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Назад
              </button>
              <span>
                Страница {data.page} из {data.totalPages || 1}
              </span>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Вперёд →
              </button>
            </div>
          </>
        )}
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={() => {
            setEditingUser(null);
            load();
          }}
        />
      )}
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Обзор" },
  { id: "users", label: "Пользователи" },
  { id: "levels", label: "Уровни" },
  { id: "promocodes", label: "Промокоды" },
];

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem("admin_token"));
  const [tab, setTab] = useState("overview");

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setAuthed(false);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-title">
          MAXI <span>ADMIN</span>
        </div>
        <nav>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`nav-item ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <button className="logout-btn" onClick={handleLogout}>
          Выйти
        </button>
      </aside>

      <main className="main">
        {tab === "overview" && <OverviewTab />}
        {tab === "users" && <UsersTab />}
        {tab === "levels" && <LevelsTab />}
        {tab === "promocodes" && <PromocodesTab />}
      </main>
    </div>
  );
}
