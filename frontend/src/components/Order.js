import React, { useState, useCallback, useEffect } from "react";
import { TextField, Button, Typography, Stack } from "@mui/material";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const OrderForm = () => {
  const [foodName, setFoodName] = useState(""); // 음식 이름 입력
  const [quantity, setQuantity] = useState(1); // 수량 입력
  const [isSubmitting, setIsSubmitting] = useState(false); // 주문 전송 상태
  const [client, setClient] = useState(null); // 웹소켓 클라이언트 저장
  const [isConnected, setIsConnected] = useState(false); // 웹소켓 연결 상태 추적

  // 웹소켓 연결을 useEffect에서 한 번만 설정
  useEffect(() => {
    if (!isConnected) {
      const socket = new SockJS("http://localhost:8080/ws");
      const stompClient = new Client({
        webSocketFactory: () => socket,
        debug: (str) => console.log(str),
        reconnectDelay: 5000,
        onConnect: () => {
          console.log("WebSocket Connected");
          setIsConnected(true); // 연결 성공 시 상태 변경
        },
        onStompError: (error) => {
          console.error("WebSocket Error:", error);
        },
      });
      stompClient.activate(); // 웹소켓 연결 활성화
      setClient(stompClient); // 클라이언트 상태 저장
    }

    return () => {
      // 컴포넌트가 언마운트될 때 웹소켓 연결 종료
      if (client) {
        client.deactivate();
      }
    };
  }, [isConnected, client]);

  // 주문 제출 핸들러
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderData = { foodName, quantity, status: "접수 대기" };

    try {
      if (client && isConnected) {
        client.publish({
          destination: "/app/order", // WebSocket으로 주문 전송
          body: JSON.stringify(orderData),
        });
        console.log("Order sent:", orderData);
      } else {
        console.error("WebSocket is not connected");
      }
    } catch (error) {
      console.error("Error sending order:", error);
    } finally {
      setIsSubmitting(false);
      setFoodName("");
      setQuantity(1);
    }
  }, [foodName, quantity, client, isConnected]);

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
