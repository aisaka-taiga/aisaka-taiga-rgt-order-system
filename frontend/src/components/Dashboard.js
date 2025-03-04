import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card, CardContent, Typography, List, ListItem, ListItemText, Box, Button, CircularProgress, Snackbar, Alert, Paper
} from "@mui/material";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const API_BASE_URL = "http://localhost:8080";
const WS_ENDPOINT = `${API_BASE_URL}/ws`;
const ORDERS_ENDPOINT = `${API_BASE_URL}/api/orders`;

// localStorage 키
const LS_KEYS = {
  ORDERS: 'orders',
  LAST_UPDATED: 'orders_last_updated',
  LAST_ID: 'last_order_id'
};

// localStorage 유틸리티 함수
const localStorageUtil = {
  getOrders: () => {
    try {
      const ordersJson = localStorage.getItem(LS_KEYS.ORDERS);
      return ordersJson ? JSON.parse(ordersJson) : [];
    } catch (error) {
      console.error('Error loading orders from localStorage:', error);
      return [];
    }
  },
  
  saveOrders: (orders) => {
    try {
      localStorage.setItem(LS_KEYS.ORDERS, JSON.stringify(orders));
      localStorage.setItem(LS_KEYS.LAST_UPDATED, Date.now().toString());
    } catch (error) {
      console.error('Error saving orders to localStorage:', error);
    }
  },
  
  getLastId: () => {
    try {
      return parseInt(localStorage.getItem(LS_KEYS.LAST_ID) || '0', 10);
    } catch (error) {
      return 0;
    }
  },
  
  setLastId: (id) => {
    localStorage.setItem(LS_KEYS.LAST_ID, id.toString());
  },
  
  getLastUpdated: () => {
    return parseInt(localStorage.getItem(LS_KEYS.LAST_UPDATED) || '0', 10);
  },
  
  isCacheValid: (maxAgeMs = 5 * 60 * 1000) => { // 기본값 5분
    const lastUpdated = localStorageUtil.getLastUpdated();
    return lastUpdated > 0 && (Date.now() - lastUpdated) < maxAgeMs;
  },
  
  clearCache: () => {
    localStorage.removeItem(LS_KEYS.ORDERS);
    localStorage.removeItem(LS_KEYS.LAST_UPDATED);
  }
};

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [webSocketStatus, setWebSocketStatus] = useState("연결 대기 중...");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const stompClientRef = useRef(null);
  const maxOrdersRef = useRef(100); // 최대 100개의 주문만 저장

  // 오프라인 상태 감지
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

  // 주문 목록 로드 (localStorage 우선 사용)
  const fetchOrders = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      // 첫 페이지이고 캐시가 유효하면 localStorage에서 데이터 로드
      if (page === 0 && localStorageUtil.isCacheValid()) {
        const cachedOrders = localStorageUtil.getOrders();
        if (cachedOrders.length > 0) {
          console.log('Using cached orders from localStorage');
          setOrders(cachedOrders);
          setHasMore(cachedOrders.length >= 10);
          setLoading(false);
          
          // 백그라운드에서 새로운 주문 확인
          fetchNewOrdersSinceLastId();
          return;
        }
      }
      
      // 오프라인이면 localStorage만 사용
      if (isOffline) {
        if (page === 0) {
          const cachedOrders = localStorageUtil.getOrders();
          setOrders(cachedOrders);
          setNotification({
            message: '오프라인 모드: 저장된 데이터를 표시합니다',
            severity: 'warning'
          });
        }
        setHasMore(false);
        setLoading(false);
        return;
      }
      
      // 온라인 상태면 서버에서 데이터 가져오기
      const response = await fetch(`${ORDERS_ENDPOINT}?page=${page}&size=10`);
      if (!response.ok) throw new Error("주문 데이터를 가져오는데 실패했습니다");
      
      const data = await response.json();
      
      setOrders(prevOrders => {
        // 첫 페이지면 교체, 아니면 추가
        const newOrders = page === 0 ? data : [...prevOrders, ...data];
        
        // 중복 제거 및 정렬
        const uniqueOrders = [...new Map(newOrders.map(order => [order.id, order])).values()]
          .sort((a, b) => b.id - a.id);
        
        // 첫 페이지면 localStorage에 저장
        if (page === 0) {
          localStorageUtil.saveOrders(uniqueOrders);
          
          // 마지막 ID 업데이트
          if (uniqueOrders.length > 0) {
            localStorageUtil.setLastId(uniqueOrders[0].id);
          }
        }
        
        return uniqueOrders;
      });
      
      setHasMore(data.length === 10);
      
    } catch (err) {
      console.error("Error loading orders:", err);
      setError(`데이터 로드 오류: ${err.message}`);
      
      // 오류 발생시 캐시 데이터 사용
      if (page === 0) {
        const cachedOrders = localStorageUtil.getOrders();
        if (cachedOrders.length > 0) {
          setOrders(cachedOrders);
          setNotification({
            message: '서버 연결 오류: 캐시된 데이터를 표시합니다',
            severity: 'warning'
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [page, loading, isOffline]);

  // 마지막 ID 이후의 새 주문만 가져오기
  const fetchNewOrdersSinceLastId = async () => {
    if (isOffline) return;
    
    try {
      const lastId = localStorageUtil.getLastId();
      const response = await fetch(`${API_BASE_URL}/api/orders/since?lastId=${lastId}`);
      
      if (!response.ok) throw new Error('새 주문 데이터를 가져오는데 실패했습니다');
      
      const newOrders = await response.json();
      
      if (newOrders.length > 0) {
        console.log(`Fetched ${newOrders.length} new orders since ID ${lastId}`);
        
        // 새 주문이 있으면 주문 목록 업데이트
        setOrders(prevOrders => {
          // 모든 주문 합치기 (새 주문 + 기존 주문)
          const allOrders = [...newOrders, ...prevOrders];
          
          // 중복 제거 및 정렬
          const uniqueOrders = [...new Map(allOrders.map(order => [order.id, order])).values()]
            .sort((a, b) => b.id - a.id);
          
          // 최대 개수 제한
          const limitedOrders = uniqueOrders.slice(0, maxOrdersRef.current);
          
          // 새 주문이 있으면 localStorage 업데이트
          localStorageUtil.saveOrders(limitedOrders);
          
          // 최신 ID 업데이트
          if (limitedOrders.length > 0 && limitedOrders[0].id > lastId) {
            localStorageUtil.setLastId(limitedOrders[0].id);
          }
          
          return limitedOrders;
        });
      }
    } catch (error) {
      console.error('Error fetching new orders:', error);
    }
  };

  // 웹소켓 연결 설정
  const setupWebSocket = useCallback(() => {
    if (isOffline) return () => {};
    
    if (stompClientRef.current && stompClientRef.current.active) {
      stompClientRef.current.deactivate();
    }

    const socket = new SockJS(WS_ENDPOINT);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: () => {
        console.log("WebSocket connected");
        setWebSocketStatus("웹소켓 연결됨");
        
        client.subscribe("/topic/orders", (message) => {
          try {
            const newOrder = JSON.parse(message.body);
            console.log("New order received:", newOrder);
            
            setOrders(prevOrders => {
              // 이미 존재하는지 확인
              if (prevOrders.some(order => order.id === newOrder.id)) {
                return prevOrders;
              }
              
              // 새 주문을 맨 앞에 추가
              const updatedOrders = [newOrder, ...prevOrders].slice(0, maxOrdersRef.current);
              
              // localStorage 업데이트
              localStorageUtil.saveOrders(updatedOrders);
              
              // 최신 ID 업데이트
              localStorageUtil.setLastId(Math.max(newOrder.id, localStorageUtil.getLastId()));
              
              return updatedOrders;
            });
            
            // 알림 표시
            setNotification({
              message: `새 주문: ${newOrder.foodName} (${newOrder.quantity}개)`,
              severity: 'info'
            });
          } catch (error) {
            console.error("Error processing message:", error);
          }
        });
        
        client.subscribe("/topic/errors", (message) => {
          console.error("Server error:", message.body);
          setError(`서버 오류: ${message.body}`);
        });
      },
      
      onStompError: (frame) => {
        console.error("STOMP error:", frame);
        setWebSocketStatus("웹소켓 오류 발생");
        setError("웹소켓 연결 중 오류가 발생했습니다");
      },
      
      onDisconnect: () => {
        console.log("WebSocket disconnected");
        setWebSocketStatus("웹소켓 연결 끊김");
      }
    });

    client.activate();
    stompClientRef.current = client;
    
    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, [isOffline]);

  // 컴포넌트 마운트 시 초기 설정
  
  useEffect(() => {
  console.log("Updated hasMore:", hasMore);
}, [hasMore]);
  
  useEffect(() => {
    // 이미 localStorage에 저장된 주문이 있으면 먼저 표시
    const cachedOrders = localStorageUtil.getOrders();
    if (cachedOrders.length > 0) {
      setOrders(cachedOrders);
    }
    
    fetchOrders();
  }, [page, fetchOrders]);

  // 웹소켓 연결
  useEffect(() => {
    const cleanup = setupWebSocket();
    
    // 주기적으로 새 주문 확인 (1분마다)
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        fetchNewOrdersSinceLastId();
      }
    }, 60000);
    
    return () => {
      cleanup();
      clearInterval(intervalId);
    };
  }, [setupWebSocket, isOffline]);

  // 더 불러오기
  const loadMore = () => {
    if (!loading && hasMore) {
	//setHasMore(true);
      setPage(prevPage => prevPage + 1);
    }
  };

  // 새로고침
  const refreshOrders = () => {
    setPage(0);
    setOrders([]);
    localStorageUtil.clearCache();
    fetchOrders();
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            실시간 주문 현황
          </Typography>
          <Box>
            {isOffline && (
              <Typography variant="caption" color="error" sx={{ mr: 1 }}>
                오프라인 모드
              </Typography>
            )}
            <Button 
              variant="outlined" 
              size="small" 
              onClick={refreshOrders}
              disabled={loading}
            >
              새로고침
            </Button>
          </Box>
        </Box>
        
        <Box mb={2} display="flex" alignItems="center">
          <Typography variant="body2" color={
            webSocketStatus.includes("연결됨") ? "success.main" :
            webSocketStatus.includes("오류") ? "error.main" : "text.secondary"
          }>
            {isOffline ? "오프라인 상태" : webSocketStatus}
          </Typography>
        </Box>
        
        {error && (
          <Box mb={2} p={1} bgcolor="error.light" borderRadius={1}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}
        
        <List sx={{ minHeight: 200 }}>
		  {orders.length > 0 ? (
			orders.map(order => (
			  <ListItem key={order.id} divider>
				<ListItemText
				  primary={`#${order.id}: ${order.foodName} - ${order.quantity}개`}
				  secondary={`상태: ${order.status}`}
				/>
			  </ListItem>
			))
		  ) : (
			<ListItem sx={{ minHeight: 50 }}> {/* 최소 높이 설정 */}
			  <ListItemText primary="주문 내역이 없습니다" />
			</ListItem>
		  )}
		</List>
        
        {loading && (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        <Snackbar 
          open={notification !== null} 
          autoHideDuration={3000}
          onClose={() => setNotification(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {notification && (
            <Alert severity={notification.severity} sx={{ width: '100%' }}>
              {notification.message}
            </Alert>
          )}
        </Snackbar>
      </CardContent>
    </Card>
  );
};

export default Dashboard;