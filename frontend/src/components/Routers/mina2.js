import { useEffect, useMemo, useState } from "react";

// ----- helpers -----
const STORAGE_PREFIX = "todo";
const keyFor = (userId) => `${STORAGE_PREFIX}::${userId}`;

function uuid() {
  return crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
}

function normalizeTasks(data) {
  // Se vier como array de strings, converte para objetos
  if (Array.isArray(data) && typeof data[0] === "string") {
    return data.map((title, idx) => ({
      id: uuid(),
      title,
      done: false,
      updatedAt: Date.now() - (data.length - idx) * 1000,
    }));
  }
  return Array.isArray(data) ? data : [];
}

// ---- Toast simples (popup) ----
function Toast({ open, message, onClose }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        maxWidth: 420,
        background: "#111",
        color: "#fff",
        padding: "12px 14px",
        borderRadius: 10,
        boxShadow: "0 6px 18px rgba(0,0,0,.3)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        zIndex: 9999,
      }}
      onClick={onClose}
      title="Clique para fechar"
    >
      <span style={{ fontSize: 18 }}>↕</span>
      <div style={{ lineHeight: 1.2 }}>{message}</div>
    </div>
  );
}

export default function WriterApp() {
  const [userId, setUserId] = useState(
    () => localStorage.getItem("currentUserId") || ""
  );
  const [tasks, setTasks] = useState([]);
  const [draggingFrom, setDraggingFrom] = useState(null);
  const [draggingTo, setDraggingTo] = useState(null);

  // Toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Carrega tarefas quando definir/alterar userId
  useEffect(() => {
    if (!userId) return;
    localStorage.setItem("currentUserId", userId);
    const saved = localStorage.getItem(keyFor(userId));
    const parsed = saved ? JSON.parse(saved) : null;

    const initial =
      parsed && parsed.length
        ? normalizeTasks(parsed)
        : normalizeTasks([
            "Estudar React",
            "Criar ToDo simples",
            "Adicionar Drag & Drop",
          ]);

    setTasks(initial);
  }, [userId]);

  // Persiste sempre que tasks mudarem
  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(keyFor(userId), JSON.stringify(tasks));
  }, [tasks, userId]);

  function handleDragStart(index) {
    setDraggingFrom(index);
    setDraggingTo(index);
  }

  function handleDragOver(e, index) {
    e.preventDefault(); // necessário para permitir soltar
    // Evita refazer operação quando passar no mesmo item
    if (draggingTo === index || draggingFrom === null) {
      setDraggingTo(index);
      return;
    }

    // Reordena live durante o drag
    setTasks((prev) => {
      const newTasks = [...prev];
      const [dragged] = newTasks.splice(draggingTo, 1); // tirar da posição atual
      newTasks.splice(index, 0, dragged); // inserir na nova posição
      return newTasks;
    });
    setDraggingTo(index);
  }

  function handleDragEnd() {
    // Se houve mudança de posição, mostra o toast
    if (
      draggingFrom !== null &&
      draggingTo !== null &&
      draggingFrom !== draggingTo
    ) {
      const movedTask = tasks[draggingTo];
      const fromPos = draggingFrom + 1;
      const toPos = draggingTo + 1;

      setToastMsg(`A tarefa "${movedTask?.title}" mudou de posição: ${fromPos} → ${toPos}`);
      setToastOpen(true);
      // vibração leve (opcional, em dispositivos que suportam)
      if (navigator?.vibrate) navigator.vibrate(20);
    }
    setDraggingFrom(null);
    setDraggingTo(null);
  }

  const addTask = () => {
    const title = prompt("Nome da nova tarefa:");
    if (!title) return;
    setTasks((prev) => [
      ...prev,
      { id: uuid(), title, done: false, updatedAt: Date.now() },
    ]);
  };

  const toggleDone = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, done: !t.done, updatedAt: Date.now() } : t
      )
    );
  };

  const removeTask = (id) => {
    if (!("Remover esta tarefa?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // UI simples de "login"
  if (!userId) {
    return (
      <div style={{ maxWidth: 420, margin: "40px auto", fontFamily: "Arial" }}>
        <h2>Entrar</h2>
        <p>Informe um identificador de usuário (ex.: seu e-mail):</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = e.currentTarget.userId.value.trim();
            if (v) setUserId(v);
          }}
        >
          <input
            name="userId"
            placeholder="usuario@empresa.com"
            style={{ padding: 10, width: "100%", marginBottom: 12 }}
          />
          <button
            type="submit"
            style={{
              padding: "10px 16px",
              background: "#2a6df4",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              width: "100%",
            }}
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>To‑Do List (Drag & Drop) — Writer</h2>
        <div>
          <small style={{ opacity: 0.7 }}>Usuário:</small>{" "}
          <strong>{userId}</strong>{" "}
          <button
            onClick={() => setUserId("")}
            style={{
              marginLeft: 8,
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              cursor: "pointer",
              background: "#fff",
            }}
          >
            Trocar
          </button>
        </div>
      </div>

      <button
        onClick={addTask}
        style={{
          padding: "10px 16px",
          marginBottom: 20,
          background: "#2a6df4",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        + Adicionar Tarefa
      </button>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map((task, index) => (
          <li
            key={task.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            style={{
              padding: "12px",
              margin: "8px 0",
              background: "#f0f0f0",
              borderRadius: 8,
              cursor: "grab",
              border: "1px solid #ccc",
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: draggingTo === index ? 0.6 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleDone(task.id)}
            />
            <span
              style={{
                flex: 1,
                textDecoration: task.done ? "line-through" : "none",
                color: task.done ? "#555" : "#000",
              }}
            >
              {task.title}
            </span>
            <button
              onClick={() => removeTask(task.id)}
              style={{
                padding: "6px 8px",
                background: "#fff",
                border: "1px solid #ccc",
                borderRadius: 6,
                cursor: "pointer",
              }}
              title="Remover"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {/* Popup (toast) */}
      <Toast
        open={toastOpen}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
