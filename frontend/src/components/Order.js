// OrderForm.js
import React, { useState, useCallback } from "react";
import { TextField, Button, Typography, Card, CardContent, Stack } from "@mui/material";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const OrderForm = () => {
  const [foodName, setFoodName] = useState("");  // 음식 이름 입력
  const [quantity, setQuantity] = useState(1);  // 수량 입력
  const [isSubmitting, setIsSubmitting] = useState(false);  // 주문 전송 상태

  // 주문 제출 핸들러
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderData = { foodName, quantity, status: "접수 대기" };

    try {
      // WebSocket 연결 및 주문 전송
      const socket = new SockJS("http://localhost:8080/ws");
      const client = new Client({
        webSocketFactory: () => socket,
        debug: (str) => console.log(str),
        reconnectDelay: 5000,
        onConnect: () => {
          client.publish({
            destination: "/app/order",  // WebSocket으로 주문 전송
            body: JSON.stringify(orderData),
          });
          console.log("Order sent:", orderData);
        },
        onStompError: (error) => {
          console.error("WebSocket Error:", error);
        },
      });

      client.activate();
    } catch (error) {
      console.error("Error sending order:", error);
    } finally {
      setIsSubmitting(false);
      setFoodName("");
      setQuantity(1);
    }
  }, [foodName, quantity]);

  return (
    <div>
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
        <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
          {isSubmitting ? "주문 중..." : "주문하기"}
        </Button>
      </Stack>
    </div>
  );
};

export default OrderForm;
