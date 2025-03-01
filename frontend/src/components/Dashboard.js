import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, List, ListItem, ListItemText } from "@mui/material";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);

  // 기존 주문 목록 가져오기
  const fetchOrders = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/orders");
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

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
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          실시간 주문 현황
        </Typography>
        <List>
          {orders.map((order, index) => (
            <ListItem key={index} divider>
              <ListItemText primary={`${order.foodName} - ${order.quantity}개`} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
