import React from "react";

const TestComponent: React.FC = () => {
  console.log("TestComponent renderizado com sucesso!");

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f0f0f0",
        border: "2px solid #333",
        margin: "20px",
        textAlign: "center",
      }}
    >
      <h1 style={{ color: "#333", fontSize: "24px" }}>Teste de Renderização</h1>
      <p style={{ color: "#666", fontSize: "16px" }}>
        Se você está vendo isso, o React está funcionando!
      </p>
      <p style={{ color: "#999", fontSize: "14px" }}>
        Timestamp: {new Date().toLocaleString()}
      </p>
    </div>
  );
};

export default TestComponent;
