import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, List, ListItem, ListItemText } from "@mui/material";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const Dashboard = () => {
  const [orders, setOrders] = useState([]); // 기본값을 빈 배열로 설정

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

  // 웹소켓 연결 및 구독 설정
  const connectWebSocket = () => {
    const socket = new SockJS("http://localhost:8080/ws"); // 서버의 웹소켓 주소
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str), // 디버깅 메시지
      reconnectDelay: 5000, // 연결 끊어지면 5초 후 재연결 시도
      onConnect: () => {
        console.log("Connected to WebSocket");

        // 주문 정보 구독
        client.subscribe("/topic/orders", (message) => {
          try {
            const newOrder = JSON.parse(message.body); // 받은 메시지 처리
            console.log("New order received:", newOrder); // 확인을 위한 로그

            // id가 없더라도 foodName, quantity, status가 있는 유효한 데이터로 간주
            if (newOrder && newOrder.foodName && newOrder.quantity !== undefined && newOrder.status) {
              setOrders((prevOrders) => [...prevOrders, newOrder]);
            } else {
              console.error("Received data is not a valid order", newOrder);
            }
          } catch (error) {
            console.error("Error parsing message body:", error);
          }
        });
      },
      onStompError: (error) => {
        console.error("WebSocket Error:", error);
      },
      onDisconnect: () => {
        console.log("WebSocket Disconnected");
        connectWebSocket();  // 연결 끊어지면 재연결
      },
    });

    client.activate();
  };

  // useEffect 훅을 이용하여 컴포넌트 로드 시 API 호출 및 웹소켓 연결
  useEffect(() => {
    fetchOrders(); // 기존 주문 목록을 가져옴
    connectWebSocket(); // 웹소켓 연결 설정

    return () => {
      // 컴포넌트가 언마운트될 때 클린업 (예: 웹소켓 연결 종료 등)
    };
  }, []); // 빈 배열로 두면 컴포넌트가 처음 렌더링될 때만 호출됨

  // 주문 리스트 렌더링
  const orderList = orders.map((order, index) => (
    <ListItem key={order.id || order.foodName || index} divider> {/* id가 없으면 foodName 또는 index를 key로 사용 */}
      <ListItemText
        primary={`${order.foodName} - ${order.quantity}개`} // 음식 이름과 수량
        secondary={`상태: ${order.status}`} // 주문 상태
      />
    </ListItem>
  ));

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
