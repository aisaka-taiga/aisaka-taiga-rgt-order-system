import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, Typography, List, ListItem, ListItemText } from "@mui/material";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);

  // 기존 주문 목록 가져오기
  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8080/api/orders");
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }, []);

  // useEffect 내에서 fetchOrders 호출
  useEffect(() => {
    fetchOrders();

    // 웹소켓 연결
    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Connected to WebSocket");
        client.subscribe("/topic/orders", (message) => {
          const newOrder = JSON.parse(message.body);
          setOrders((prevOrders) => [...prevOrders, newOrder]);
        });
      },
      onStompError: (error) => {
        console.error("WebSocket Error:", error);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [fetchOrders]);

  // `orders` 배열을 useMemo로 메모이제이션하여 불필요한 렌더링을 방지
  const orderList = useMemo(() => {
    return orders.map((order) => (
      <ListItem key={order.id} divider>
        <ListItemText primary={`${order.foodName} - ${order.quantity}개`} />
      </ListItem>
    ));
  }, [orders]); // `orders`가 변경될 때만 리렌더링

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          실시간 주문 현황
        </Typography>
        <List>{orderList}</List>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
