import React, { useState } from "react";

function App() {
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const orderData = { foodName, quantity };

    try {
      const response = await fetch("http://localhost:8080/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        setMessage("주문이 접수되었습니다.");
      } else {
        setMessage("주문 실패! 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("서버 오류 발생!");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>식당 주문 시스템</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>음식 이름: </label>
          <input
            type="text"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>수량: </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />
        </div>
        <button type="submit">주문</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default App;
