import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, List, ListItem, ListItemText, Box } from "@mui/material";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const Dashboard = () => {
  const [orders, setOrders] = useState([]); // 기본값을 빈 배열로 설정
  const [webSocketStatus, setWebSocketStatus] = useState("연결 대기 중..."); // 웹소켓 상태
  const [page, setPage] = useState(0); // 현재 페이지
  const [hasMore, setHasMore] = useState(true); // 더 이상 불러올 주문이 있는지

  // 주문을 localStorage에 저장하는 함수
  const saveOrdersToLocalStorage = (orders) => {
    localStorage.setItem("orders", JSON.stringify(orders));
  };

  // 주문을 localStorage에서 불러오는 함수
  const loadOrdersFromLocalStorage = () => {
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      return JSON.parse(savedOrders);
    }
    return [];
  };

  // localStorage 초기화 함수
  const clearLocalStorage = () => {
    localStorage.removeItem("orders");
  };

  // 주문을 서버에서 최신으로 가져오는 함수
  const loadOrders = async () => {
    try {
      // 서버에서 최신 주문 데이터를 요청
      const response = await fetch(`http://localhost:8080/api/orders?page=${page}&size=10`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();

      if (data.length < 10) {
        setHasMore(false); // 더 이상 불러올 데이터가 없으면
      } else {
        setHasMore(true); // 데이터가 있으면 더 불러올 수 있다는 상태로 설정
      }

      // 주문 목록을 최신 데이터로 갱신하고 localStorage에 저장
      setOrders(data); // 정렬을 이곳에서 하지 않음
      saveOrdersToLocalStorage(data); // 최신 데이터를 localStorage에 저장
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  // 웹소켓 연결 및 새로운 주문을 처리하는 함수
  const connectWebSocket = () => {
    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Connected to WebSocket");
        setWebSocketStatus("웹소켓 연결됨");

        // 웹소켓에서 새로운 주문을 받으면 주문 목록에 추가
        client.subscribe("/topic/orders", (message) => {
          try {
            const newOrder = JSON.parse(message.body);
            console.log("New order received:", newOrder);

            // 새로운 주문을 기존 주문 목록에 추가
            setOrders((prevOrders) => {
              const orderExists = prevOrders.some(order => order.id === newOrder.id);
              if (orderExists) {
                return prevOrders; // 중복된 주문은 추가하지 않음
              }
              return [newOrder, ...prevOrders]; // 새로운 주문을 맨 앞에 추가
            });
          } catch (error) {
            console.error("Error parsing message body:", error);
          }
        });
      },
      onStompError: (error) => {
        console.error("WebSocket Error:", error);
        setWebSocketStatus("웹소켓 오류 발생");
      },
      onDisconnect: () => {
        console.log("WebSocket Disconnected");
        setWebSocketStatus("웹소켓 연결 끊김");
        connectWebSocket(); // 연결 끊어지면 재연결
      },
    });

    client.activate();
  };

  // useEffect 훅을 이용하여 컴포넌트 로드 시 API 호출 및 웹소켓 연결
  useEffect(() => {
    loadOrders(); // 서버에서 최신 주문을 가져옴
    connectWebSocket(); // 웹소켓 연결
  }, [page]); // 페이지가 변경될 때마다 다시 호출되도록 설정

  // 주문 리스트 렌더링 (id 내림차순으로 정렬)
  const orderList = orders
    .sort((a, b) => b.id - a.id)  // 주문이 내림차순으로 정렬되도록
    .slice(0, 10) // 최신 10개만 표시
    .map((order) => (
      <ListItem key={order.id} divider>
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
        {webSocketStatus}
        <List>{orderList}</List>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
