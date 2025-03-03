import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card, CardContent, Typography, List, ListItem, ListItemText, Box, Button, CircularProgress, Snackbar, Alert, Paper
} from "@mui/material";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const API_BASE_URL = "http://localhost:8080";
const WS_ENDPOINT = `${API_BASE_URL}/ws`;
const ORDERS_ENDPOINT = `${API_BASE_URL}/api/orders`;

const LS_KEYS = {
  ORDERS: 'orders',
  LAST_UPDATED: 'orders_last_updated',
  LAST_ID: 'last_order_id'
};

const localStorageUtil = {
  getOrders: () => JSON.parse(localStorage.getItem(LS_KEYS.ORDERS) || "[]"),
  saveOrders: (orders) => localStorage.setItem(LS_KEYS.ORDERS, JSON.stringify(orders)),
  getLastId: () => parseInt(localStorage.getItem(LS_KEYS.LAST_ID) || '0', 10),
  setLastId: (id) => localStorage.setItem(LS_KEYS.LAST_ID, id.toString()),
  isCacheValid: (maxAgeMs = 5 * 60 * 1000) => Date.now() - (parseInt(localStorage.getItem(LS_KEYS.LAST_UPDATED) || '0', 10)) < maxAgeMs
};

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasMore, setHasMore] = useState(true);
  const [notification, setNotification] = useState(null);
  const [page, setPage] = useState(0);

  const observerRef = useRef(null);
  const lastOrderRef = useRef(null);
  const stompClientRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchOrders = useCallback(async () => {
	  if (loading || !hasMore) return;
	  setLoading(true);

	  try {
		if (page === 0 && localStorageUtil.isCacheValid()) {
		  const cachedOrders = localStorageUtil.getOrders();
		  setOrders(cachedOrders);
		  setLoading(false);
		  return;
		}

		if (isOffline) {
		  setOrders(localStorageUtil.getOrders());
		  setLoading(false);
		  return;
		}

		const response = await fetch(`${ORDERS_ENDPOINT}?page=${page}&size=10`);
		if (!response.ok) throw new Error("주문 데이터를 가져오는데 실패했습니다");

		const data = await response.json();

		setOrders(prevOrders => {
		  // 기존 주문과 새 주문을 ID 기준으로 중복 제거
		  const orderMap = new Map();
		  prevOrders.forEach(order => orderMap.set(order.id, order));
		  data.forEach(order => orderMap.set(order.id, order));

		  const uniqueOrders = Array.from(orderMap.values());

		  if (data.length < 10) setHasMore(false);
		  else setPage(prev => prev + 1);

		  if (page === 0) localStorageUtil.saveOrders(uniqueOrders);

		  return uniqueOrders;
		});
	  } catch (err) {
		setError(err.message);
	  } finally {
		setLoading(false);
	  }
	}, [page, loading, hasMore, isOffline]);


	const fetchNewOrders = useCallback(async () => {
	  if (isOffline) return;

	  try {
		const lastId = localStorageUtil.getLastId();
		const response = await fetch(`${API_BASE_URL}/api/orders/since?lastId=${lastId}`);
		if (!response.ok) throw new Error('새 주문 데이터를 가져오는데 실패했습니다');

		const newOrders = await response.json();
		if (newOrders.length > 0) {
		  // 중복 제거 (Set 사용)
		  const uniqueOrders = Array.from(new Set([...newOrders, ...orders].map(o => JSON.stringify(o))))
									.map(str => JSON.parse(str));

		  setOrders(uniqueOrders);
		  localStorageUtil.saveOrders(uniqueOrders);
		  localStorageUtil.setLastId(newOrders[0].id);
		  setNotification({ message: `새 주문 ${newOrders.length}개 도착`, severity: 'info' });
		}
	  } catch (error) {
		console.error('Error fetching new orders:', error);
	  }
	}, [isOffline, orders]);

  const setupWebSocket = useCallback(() => {
    if (isOffline) return;

    const socket = new SockJS(WS_ENDPOINT);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe("/topic/orders", (message) => {
          const newOrder = JSON.parse(message.body);
          setOrders(prevOrders => [newOrder, ...prevOrders]);
          localStorageUtil.setLastId(newOrder.id);
          setNotification({ message: `새 주문: ${newOrder.foodName}`, severity: 'info' });
        });
      }
    });

    client.activate();
    stompClientRef.current = client;
    return () => client.deactivate();
  }, [isOffline]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const cleanup = setupWebSocket();
    const intervalId = setInterval(fetchNewOrders, 60000);
    return () => {
      cleanup();
      clearInterval(intervalId);
    };
  }, [setupWebSocket, fetchNewOrders]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        fetchOrders();
      }
    });

    if (lastOrderRef.current) observerRef.current.observe(lastOrderRef.current);
  }, [orders, hasMore, loading, fetchOrders]);

  return (
    <Card sx={{ minHeight: 300 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">실시간 주문 현황</Typography>
          <Button variant="outlined" size="small" onClick={() => setPage(0)} disabled={loading}>새로고침</Button>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {notification && <Snackbar open autoHideDuration={3000} onClose={() => setNotification(null)}><Alert severity={notification.severity}>{notification.message}</Alert></Snackbar>}

        {orders.length === 0 && !loading ? <Paper elevation={0} sx={{ p: 3, textAlign: 'center', border: '1px dashed #ccc' }}><Typography>주문 내역이 없습니다</Typography></Paper> : (
          <List>
            {orders.map((order, index) => (
              <ListItem key={order.id} divider ref={index === orders.length - 1 ? lastOrderRef : null}>
                <ListItemText primary={`#${order.id}: ${order.foodName} - ${order.quantity}개`} />
              </ListItem>
            ))}
          </List>
        )}

        {loading && <Box display="flex" justifyContent="center" my={2}><CircularProgress /></Box>}
      </CardContent>
    </Card>
  );
};

export default Dashboard;
