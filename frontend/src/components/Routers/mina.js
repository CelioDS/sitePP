import { useState, useEffect } from "react";

export default function App() {
  const [tasks, setTasks] = useState([
    "Estudar React",
    "Criar ToDo simples",
    "Adicionar Drag & Drop"
  ]);

  const [draggingIndex, setDraggingIndex] = useState(null);

  function handleDragStart(index) {
    setDraggingIndex(index);
  }

  nfgsgag



  function handleDragOver(index) {
    if (draggingIndex === index) return;

    const newTasks = [...tasks];
    const draggedItem = newTasks[draggingIndex];

    newTasks.splice(draggingIndex, 1);
    newTasks.splice(index, 0, draggedItem);

    setDraggingIndex(index);
    setTasks(newTasks);
  }

  const addTask = () => {
    const name = prompt("Nome da nova tarefa:");
    alert("oi")
    if (!name) return;

    setTasks([...tasks, name]);
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>To‑Do List (Drag & Drop)</h2>

      <button
        onClick={addTask}
        style={{
          padding: "10px 16px",
          marginBottom: 20,
          background: "#2a6df4",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer"
        }}
      >
        + Adicionar Tarefa
      </button>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map((task, index) => (
          <li
            key={task}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={() => handleDragOver(index)}
            style={{
              padding: "12px",
              margin: "8px 0",
              background: "#f0f0f0",
              borderRadius: 8,
              cursor: "grab",
              border: "1px solid #ccc"
            }}
          >
            {task}
          </li>
        ))}
      </ul>
    </div>
  );
}