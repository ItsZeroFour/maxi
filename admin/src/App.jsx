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

// ==================== НАГРАДЫ ЗА УРОВНИ ====================

const BOOSTER_TYPE_OPTIONS = Object.keys(BOOSTER_LABELS);
const TOTAL_LEVELS = 30;

function LevelRewardRow({ level, config, onSaved }) {
  const [rewardType, setRewardType] = useState(config?.rewardType || "");
  const [promocode, setPromocode] = useState(config?.promocode || "");
  const [boosterType, setBoosterType] = useState(
    config?.boosterType || BOOSTER_TYPE_OPTIONS[0],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isDirty =
    rewardType !== (config?.rewardType || "") ||
    (rewardType === "promocode" && promocode !== (config?.promocode || "")) ||
    (rewardType === "booster" &&
      boosterType !== (config?.boosterType || BOOSTER_TYPE_OPTIONS[0]));

  const handleSave = async () => {
    setError("");

    if (!rewardType) {
      setError("Выберите тип приза");
      return;
    }
    if (rewardType === "promocode" && !promocode.trim()) {
      setError("Введите текст промокода");
      return;
    }

    setSaving(true);
    try {
      await api.upsertLevelReward(level, {
        rewardType,
        promocode: rewardType === "promocode" ? promocode.trim() : undefined,
        boosterType: rewardType === "booster" ? boosterType : undefined,
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(`Сбросить настройку приза для уровня ${level}?`)) {
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.deleteLevelReward(level);
      setRewardType("");
      setPromocode("");
      setBoosterType(BOOSTER_TYPE_OPTIONS[0]);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td>{level}</td>
      <td>
        <select
          className="reward-select"
          value={rewardType}
          onChange={(e) => setRewardType(e.target.value)}
        >
          <option value="">По умолчанию</option>
          <option value="booster">Бустер</option>
          <option value="promocode">Промокод</option>
        </select>
      </td>
      <td>
        {rewardType === "booster" && (
          <select
            className="reward-select"
            value={boosterType}
            onChange={(e) => setBoosterType(e.target.value)}
          >
            {BOOSTER_TYPE_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {BOOSTER_LABELS[b]}
              </option>
            ))}
          </select>
        )}
        {rewardType === "promocode" && (
          <input
            type="text"
            className="reward-input"
            placeholder="Текст промокода"
            value={promocode}
            onChange={(e) => setPromocode(e.target.value)}
          />
        )}
        {!rewardType && <span className="table-total">не настроено</span>}
      </td>
      <td className="actions-cell">
        <button
          className="edit-btn"
          onClick={handleSave}
          disabled={saving || !isDirty}
        >
          {saving ? "…" : "Сохранить"}
        </button>
        {config && (
          <button className="edit-btn" onClick={handleReset} disabled={saving}>
            Сбросить
          </button>
        )}
        {error && (
          <div className="login-error" style={{ marginTop: 6 }}>
            {error}
          </div>
        )}
      </td>
    </tr>
  );
}

function LevelRewardsPanel() {
  const [rewards, setRewards] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    api
      .getLevelRewards()
      .then((res) => setRewards(res.rewards))
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  if (error) return <div className="error-box">{error}</div>;
  if (!rewards) return <div className="loading">Загрузка…</div>;

  const configByLevel = new Map(rewards.map((r) => [r.level, r]));
  const levels = Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1);

  return (
    <div className="panel">
      <h3>Награды за уровни</h3>
      <p className="table-total" style={{ marginBottom: 12 }}>
        Для любого уровня можно назначить приз: бустер (выбрать тип) или
        промокод (свой текст). Пока тип приза не выбран, уровень использует
        поведение по умолчанию — чередование бустеров или старый список
        промокодов.
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th>Уровень</th>
            <th>Тип приза</th>
            <th>Значение</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {levels.map((level) => (
            <LevelRewardRow
              key={level}
              level={level}
              config={configByLevel.get(level)}
              onSaved={load}
            />
          ))}
        </tbody>
      </table>
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

      <LevelRewardsPanel />
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

// ==================== КВИЗ ====================

const EMPTY_ANSWER = () => ({ text: "", isCorrect: false });

function QuizQuestionModal({ question, onClose, onSaved }) {
  const isEdit = !!question;

  const [form, setForm] = useState(() => ({
    question: question?.question || "",
    comment: question?.comment || "",
    order: question?.order ?? 0,
    isActive: question?.isActive ?? true,
    answers:
      question?.answers?.length > 0
        ? question.answers.map((a) => ({
            id: a.id || a._id,
            text: a.text,
            isCorrect: a.isCorrect,
          }))
        : [EMPTY_ANSWER(), EMPTY_ANSWER()],
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateAnswer = (idx, patch) => {
    setForm((f) => ({
      ...f,
      answers: f.answers.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    }));
  };

  const setCorrectAnswer = (idx) => {
    setForm((f) => ({
      ...f,
      answers: f.answers.map((a, i) => ({ ...a, isCorrect: i === idx })),
    }));
  };

  const addAnswer = () => {
    setForm((f) => ({ ...f, answers: [...f.answers, EMPTY_ANSWER()] }));
  };

  const removeAnswer = (idx) => {
    setForm((f) => ({
      ...f,
      answers: f.answers.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    setError("");

    if (!form.question.trim()) {
      setError("Введите текст вопроса");
      return;
    }
    if (form.answers.length < 2) {
      setError("Нужно минимум 2 варианта ответа");
      return;
    }
    if (form.answers.some((a) => !a.text.trim())) {
      setError("Заполните текст у всех вариантов ответа");
      return;
    }
    if (!form.answers.some((a) => a.isCorrect)) {
      setError("Отметьте правильный вариант ответа");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        question: form.question.trim(),
        comment: form.comment.trim(),
        order: Number(form.order) || 0,
        isActive: form.isActive,
        answers: form.answers.map((a) => ({
          text: a.text.trim(),
          isCorrect: a.isCorrect,
        })),
      };

      if (isEdit) {
        await api.updateQuizQuestion(question.id || question._id, payload);
      } else {
        await api.createQuizQuestion(payload);
      }

      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card modal-card-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{isEdit ? "Редактирование вопроса" : "Новый вопрос квиза"}</h3>

        <label className="quiz-field">
          Текст вопроса
          <textarea
            className="quiz-textarea"
            rows={2}
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
          />
        </label>

        <div className="modal-section-title">
          Варианты ответа (отметьте правильный)
        </div>

        <div className="quiz-answers-list">
          {form.answers.map((a, idx) => (
            <div className="quiz-answer-row" key={idx}>
              <input
                type="radio"
                name="correct-answer"
                checked={a.isCorrect}
                onChange={() => setCorrectAnswer(idx)}
                title="Правильный ответ"
              />
              <input
                type="text"
                className="quiz-answer-input"
                placeholder={`Вариант ${idx + 1}`}
                value={a.text}
                onChange={(e) => updateAnswer(idx, { text: e.target.value })}
              />
              <button
                type="button"
                className="quiz-remove-btn"
                onClick={() => removeAnswer(idx)}
                disabled={form.answers.length <= 2}
                title="Удалить вариант"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="quiz-add-btn" onClick={addAnswer}>
          + Добавить вариант
        </button>

        <label className="quiz-field" style={{ marginTop: 16 }}>
          Комментарий к вопросу
          <textarea
            className="quiz-textarea"
            rows={2}
            placeholder="Показывается пользователю после того, как он выберет ответ (при любом результате)"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
        </label>

        <div className="modal-row" style={{ marginTop: 16 }}>
          <label>
            Порядок показа
            <input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
            />
          </label>
        </div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Вопрос активен (показывается в квизе)
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

function QuizTab() {
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState("");
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    api
      .getQuizQuestions()
      .then((res) => setQuestions(res.questions))
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const handleDelete = async (question) => {
    const id = question.id || question._id;
    if (!window.confirm("Удалить этот вопрос квиза?")) return;

    setDeletingId(id);
    try {
      await api.deleteQuizQuestion(id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="tab-content">
      <div className="panel">
        <div className="table-toolbar">
          <span className="table-total">
            Пользователю показывается один вопрос из этого списка в день (по
            порядку, начиная с наименьшего "Порядок"), когда у него закончились
            попытки. +1 попытка начисляется только за верный ответ, но вне
            зависимости от результата квиз в этот день становится недоступен.
            Когда активные вопросы заканчиваются, квиз перестаёт предлагаться.
          </span>
          <button className="btn-primary" onClick={() => setCreating(true)}>
            + Добавить вопрос
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}
        {!questions && !error && <div className="loading">Загрузка…</div>}

        {questions && questions.length === 0 && (
          <div className="loading">
            Вопросов пока нет — добавьте первый, чтобы квиз заработал.
          </div>
        )}

        {questions && questions.length > 0 && (
          <div className="quiz-question-list">
            {questions.map((q) => {
              const id = q.id || q._id;
              return (
                <div className="quiz-question-card" key={id}>
                  <div className="quiz-question-card-header">
                    <span
                      className={`quiz-status-badge ${
                        q.isActive ? "active" : "inactive"
                      }`}
                    >
                      {q.isActive ? "Активен" : "Отключён"}
                    </span>
                    <span className="table-total">Порядок: {q.order}</span>
                  </div>

                  <div className="quiz-question-text">{q.question}</div>

                  <ul className="quiz-answer-preview-list">
                    {q.answers.map((a) => (
                      <li
                        key={a.id || a._id}
                        className={a.isCorrect ? "correct" : ""}
                      >
                        {a.isCorrect ? "✓ " : "— "}
                        {a.text}
                      </li>
                    ))}
                  </ul>

                  {q.comment && (
                    <div className="quiz-comment-preview">💬 {q.comment}</div>
                  )}

                  <div className="actions-cell">
                    <button
                      className="edit-btn"
                      onClick={() => setEditingQuestion(q)}
                    >
                      Изменить
                    </button>
                    <button
                      className="edit-btn"
                      onClick={() => handleDelete(q)}
                      disabled={deletingId === id}
                    >
                      {deletingId === id ? "Удаляем…" : "Удалить"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(creating || editingQuestion) && (
        <QuizQuestionModal
          question={editingQuestion}
          onClose={() => {
            setCreating(false);
            setEditingQuestion(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditingQuestion(null);
            load();
          }}
        />
      )}
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

const EVENT_META = {
  registered: { label: "Регистрация в игре", icon: "👤", color: "#8a92a6" },
  level_complete: { label: "Уровень пройден", icon: "🏁", color: "#5eead4" },
  attempts_accrual: {
    label: "Начислены попытки",
    icon: "🎟️",
    color: "#f5a623",
  },
  booster_accrual: { label: "Получен бустер", icon: "⚡", color: "#a78bfa" },
  promocode_received: {
    label: "Получен промокод",
    icon: "🎁",
    color: "#f5a623",
  },
  promocode_activated: {
    label: "Активирован промокод",
    icon: "✅",
    color: "#5eead4",
  },
};

function formatEventDate(date) {
  if (!date) return "Дата неизвестна";
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function eventDescription(event) {
  const p = event.payload || {};
  switch (event.type) {
    case "registered":
      return "Пользователь впервые авторизовался в игре";
    case "level_complete":
      return `Пройден уровень №${p.level}`;
    case "attempts_accrual":
      return `+${p.count} попыток (${p.attemptType === "MAXI" ? "MAXI" : "обычные"})`;
    case "booster_accrual":
      return `+${p.count} × ${BOOSTER_LABELS[p.boosterType] || p.boosterType}`;
    case "promocode_received":
      return `Промокод: ${p.code}`;
    case "promocode_activated":
      return `Промокод: ${p.code}`;
    default:
      return "";
  }
}

function UserLogsModal({ user, onClose }) {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getUserLogs(user.user_token)
      .then((res) => setEvents(res.events))
      .catch((e) => setError(e.message));
  }, [user.user_token]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card modal-card-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>История: {user.user_token}</h3>

        {error && <div className="error-box">{error}</div>}
        {!events && !error && <div className="loading">Загрузка…</div>}

        {events && events.length === 0 && (
          <div className="loading">Событий пока нет</div>
        )}

        {events && events.length > 0 && (
          <div className="timeline">
            {events.map((event, idx) => {
              const meta = EVENT_META[event.type] || {
                label: event.type,
                icon: "•",
                color: "#8a92a6",
              };
              return (
                <div className="timeline-item" key={idx}>
                  <div
                    className="timeline-dot"
                    style={{ borderColor: meta.color, color: meta.color }}
                  >
                    {meta.icon}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-label">{meta.label}</span>
                      <span className="timeline-date">
                        {formatEventDate(event.date)}
                      </span>
                    </div>
                    <div className="timeline-desc">
                      {eventDescription(event)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Закрыть
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
  const [logsUser, setLogsUser] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const load = () => {
    api
      .getUsers(page, 20, search)
      .then(setData)
      .catch((e) => setError(e.message));
  };

  useEffect(load, [page, search]);

  const handleExport = () => {
    setExporting(true);
    setExportError("");
    api
      .exportUsersCsv()
      .catch((e) => setExportError(e.message))
      .finally(() => setExporting(false));
  };

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
          <button
            className="edit-btn"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Экспорт…" : "Экспорт в CSV"}
          </button>
        </div>

        {exportError && <div className="error-box">{exportError}</div>}
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
                  <tr
                    key={u.user_token}
                    className="clickable-row"
                    onClick={() => setLogsUser(u)}
                  >
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
                    <td
                      className="actions-cell"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="edit-btn"
                        onClick={() => setLogsUser(u)}
                      >
                        Логи
                      </button>
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

      {logsUser && (
        <UserLogsModal user={logsUser} onClose={() => setLogsUser(null)} />
      )}

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
  { id: "quiz", label: "Квиз" },
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
        {tab === "quiz" && <QuizTab />}
      </main>
    </div>
  );
}
