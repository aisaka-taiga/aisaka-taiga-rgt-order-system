import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
      stompClient.subscribe("/topic/orders", (message) => {
        const newOrder = JSON.parse(message.body);
        setOrders((prevOrders) => [...prevOrders, newOrder]);
      });
    });

    return () => stompClient.disconnect();
  }, []);

  return (
    <div>
      <h2>실시간 주문 현황</h2>
      <table border="1">
        <thead>
          <tr>
            <th>음식</th>
            <th>수량</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <tr key={index}>
              <td>{order.foodName}</td>
              <td>{order.quantity}</td>
              <td>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
