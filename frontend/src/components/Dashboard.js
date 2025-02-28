import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);

  // 기존 주문 목록 가져오기
  const fetchOrders = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/orders"); // 백엔드 API 호출
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders(); // 최초 로딩 시 기존 주문 목록 가져오기

    // 웹소켓 연결
    const socket = new SockJS("http://localhost:8080/ws"); // SockJS로 WebSocket 연결
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str), // 디버깅 로그 출력
      reconnectDelay: 5000, // 5초마다 재연결
      onConnect: () => {
        console.log("Connected to WebSocket");
        client.subscribe("/topic/orders", (message) => {
          const newOrder = JSON.parse(message.body);
          setOrders((prevOrders) => [...prevOrders, newOrder]); // 새로운 주문 추가
        });
      },
      onStompError: (error) => {
        console.error("WebSocket Error:", error);
      },
    });

    client.activate();

    return () => {
      client.deactivate(); // 언마운트 시 웹소켓 해제
    };
  }, []);

  return (
    <div>
      <h2>실시간 주문 현황</h2>
      <ul>
        {orders.map((order, index) => (
          <li key={index}>
            {order.foodName} - {order.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
