import React, { useState } from "react";
import { TextField, Button, Typography, Card, CardContent, Stack } from "@mui/material";

const Order = () => {
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
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          주문하기
        </Typography>
        <Stack spacing={2} component="form" onSubmit={handleSubmit}>
          <TextField
            label="음식 이름"
            variant="outlined"
            fullWidth
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            required
          />
          <TextField
            label="수량"
            type="number"
            variant="outlined"
            fullWidth
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />
          <Button type="submit" variant="contained" color="primary">
            주문하기
          </Button>
        </Stack>
        {message && <Typography color="error" mt={2}>{message}</Typography>}
      </CardContent>
    </Card>
  );
};

export default Order;
