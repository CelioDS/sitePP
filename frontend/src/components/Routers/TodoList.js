import { useEffect, useState } from "react";

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

export default function WriterApp() {
  const [userId, setUserId] = useState(
    () => localStorage.getItem("currentUserId") || ""
  );
  const [tasks, setTasks] = useState([]);
  const [draggingIndex, setDraggingIndex] = useState(null);

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
    setDraggingIndex(index);
  }

  function handleDragOver(e, index) {
    e.preventDefault(); // necessário para permitir soltar
    if (draggingIndex === null || draggingIndex === index) return;

    setTasks((prev) => {
      const newTasks = [...prev];
      const [dragged] = newTasks.splice(draggingIndex, 1);
      newTasks.splice(index, 0, dragged);
      return newTasks;
    });
    setDraggingIndex(index);
  }

  function handleDragEnd() {
    setDraggingIndex(null);
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
              opacity: draggingIndex === index ? 0.6 : 1,
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
    </div>
  );
}
