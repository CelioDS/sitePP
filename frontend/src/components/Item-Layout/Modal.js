export default function Modal({ cancelar, confirmar, titulo, texto }) {
  return (
    <main
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0, 
        bottom: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "20px",
          width: "350px",
          borderRadius: "8px",
          boxShadow: "0 3px 10px rgba(0,0,0,0.5)",
        }}
      >
        <h3>{titulo}</h3>
        <p>{texto}</p>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            onClick={confirmar}
            style={{
              flex: 1,
              background: "green",
              color: "#fff",
              padding: "8px",
            }}
          >
            Confirmar
          </button>

          <button
            onClick={cancelar}
            style={{
              flex: 1,
              background: "red",
              color: "#fff",
              padding: "8px",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </main>
  );
}
