import React from "react";
import Order from "./components/Order"; // 주문 입력 폼
import Dashboard from "./components/Dashboard"; // 실시간 주문 대시보드

function App() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
      <h1>🍽️ 실시간 주문 시스템</h1>
      <div style={{ display: "flex", justifyContent: "center", gap: "50px" }}>
        <Order />
        <Dashboard />
      </div>
    </div>
  );
}

export default App;
