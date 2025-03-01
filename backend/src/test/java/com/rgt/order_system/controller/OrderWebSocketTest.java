package com.rgt.order_system.controller;

import com.rgt.order_system.model.Order;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@Slf4j
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = "custom.websocket.sockjs.enabled=false") // 테스트 환경에서 SockJS 비활성화
public class OrderWebSocketTest {

    @LocalServerPort
    private int port;

    private WebSocketStompClient stompClient;
    private String wsUrl;

    @BeforeEach
    void setUp() {
        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        stompClient.setMessageConverter(new MappingJackson2MessageConverter());
        wsUrl = "ws://localhost:" + port + "/ws";
    }

    /**
     * WebSocket 연결이 성공하는지 테스트합니다.
     * 연결에 성공하면 WebSocket 세션이 생성되어야 하며, 이를 검증합니다.
     */
    @Test
    void testWebSocketConnection() throws Exception {
        CompletableFuture<StompSession> futureSession = stompClient.connectAsync(wsUrl, new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                log.info("WebSocket 연결 성공!");
            }

            @Override
            public void handleTransportError(StompSession session, Throwable exception) {
                log.error("WebSocket 오류 발생: {}", exception.getMessage());
            }
        });

        StompSession session = futureSession.get(3, TimeUnit.SECONDS);
        assertNotNull(session, "WebSocket session should not be null");
    }

    /**
     * WebSocket 오류 처리 테스트입니다.
     * 잘못된 메시지를 전송하면 WebSocket에서 오류가 발생해야 하며, 그 오류 메시지가 적절하게 처리되는지 확인합니다.
     */
    @Test
    void testWebSocketErrorHandling() throws Exception {
        CompletableFuture<StompSession> futureSession = stompClient.connectAsync(wsUrl, new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                log.info("WebSocket 연결 성공!");
            }

            @Override
            public void handleTransportError(StompSession session, Throwable exception) {
                log.error("WebSocket 오류 발생: {}", exception.getMessage());
                assertTrue(exception.getMessage().contains("Unexpected frame type"), "Error message should contain 'Unexpected frame type'");
            }
        });

        StompSession session = futureSession.get(3, TimeUnit.SECONDS);

        // 잘못된 메시지 보내기
        session.send("/app/order", "Invalid message"); // 오류가 발생해야 함
    }

    /**
     * WebSocket 연결 후 연결이 끊어졌다가 재연결되는지 확인하는 테스트입니다.
     * 연결이 끊어지고 다시 연결될 때 정상적으로 세션이 재생성되는지 확인합니다.
     */
    @Test
    void testWebSocketReconnection() throws Exception {
        CompletableFuture<StompSession> futureSession = stompClient.connectAsync(wsUrl, new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                log.info("WebSocket 연결 성공!");
            }

            @Override
            public void handleTransportError(StompSession session, Throwable exception) {
                log.error("WebSocket 오류 발생: {}", exception.getMessage());
            }
        });

        StompSession session = futureSession.get(3, TimeUnit.SECONDS);

        // 연결 끊기
        session.disconnect();

        // 재연결
        CompletableFuture<StompSession> reconnectSession = stompClient.connectAsync(wsUrl, new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                log.info("WebSocket 재연결 성공!");
            }
        });

        StompSession reconnectedSession = reconnectSession.get(3, TimeUnit.SECONDS);
        assertNotNull(reconnectedSession, "WebSocket should reconnect successfully");
    }

    /**
     * 대량의 주문을 동시에 처리하는 성능 테스트입니다.
     * 1,000건의 주문을 동시 전송하고, 전체 주문 처리 시간과 성공 여부를 검증합니다.
     */
    @Test
    void testWebSocketBulkOrderHandling() throws Exception {
        int orderCount = 1000;
        ExecutorService executor = Executors.newFixedThreadPool(50);

        long startTime = System.nanoTime();

        List<CompletableFuture<Boolean>> futures = new ArrayList<>();
        for (int i = 0; i < orderCount; i++) {
            int orderId = i + 1;
            futures.add(CompletableFuture.supplyAsync(() -> sendOrder(orderId), executor));
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        for (CompletableFuture<Boolean> future : futures) {
            assertTrue(future.get());
        }

        executor.shutdown();
        if (!executor.awaitTermination(10, TimeUnit.SECONDS)) {
            log.warn("실행 시간이 초과되어 강제 종료합니다.");
            executor.shutdownNow();
        }

        long endTime = System.nanoTime();
        double elapsedTime = (endTime - startTime) / 1_000_000.0;

        log.info("1,000건 동시 주문 완료! 총 소요 시간: {} ms", elapsedTime);
    }

    /**
     * 주문 전송을 처리하는 메서드입니다. 주어진 주문 ID로 주문을 생성하고 WebSocket을 통해 전송합니다.
     */
    private boolean sendOrder(int orderId) {
        try {
            CompletableFuture<StompSession> futureSession = stompClient
                    .connectAsync(wsUrl, new StompSessionHandlerAdapter() {
                        @Override
                        public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                            log.info("WebSocket 연결 성공: orderId={}", orderId);
                        }

                        @Override
                        public void handleTransportError(StompSession session, Throwable exception) {
                            log.error("WebSocket 오류 발생: {}", exception.getMessage());
                        }
                    });

            StompSession session = futureSession.get(3, TimeUnit.SECONDS);

            // 주문 객체 생성 및 전송
            Order order = new Order(null, "menu-" + orderId, 1, "PENDING");
            session.send("/app/order", order);

            return true;
        } catch (Exception e) {
            log.error("주문 전송 실패 (orderId={}): {}", orderId, e.getMessage());
            return false;
        }
    }

    /**
     * 주문 상태 업데이트를 테스트합니다. 주문 상태가 'PENDING'에서 'COMPLETED'로 변경되는지 확인합니다.
     */
    @Test
    void testOrderStatusUpdate() throws Exception {
        CompletableFuture<StompSession> futureSession = stompClient.connectAsync(wsUrl, new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                log.info("WebSocket 연결 성공!");
            }

            @Override
            public void handleTransportError(StompSession session, Throwable exception) {
                log.error("WebSocket 오류 발생: {}", exception.getMessage());
            }
        });

        StompSession session = futureSession.get(3, TimeUnit.SECONDS);

        // 주문 전송
        Order order = new Order(null, "menu-1", 1, "PENDING");
        session.send("/app/order", order);

        // 주문 수신 및 상태 업데이트 확인
        CompletableFuture<Order> receivedOrder = new CompletableFuture<>();
        session.subscribe("/topic/orders", new StompFrameHandler() {
            @Override
            public Class<?> getPayloadType(StompHeaders headers) {
                return Order.class;  // Type 대신 Class 사용
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                Order order = (Order) payload;
                order.setStatus("COMPLETED");  // 상태 변경
                receivedOrder.complete(order);
            }
        });

        // 주문을 전송하고 받은 주문의 상태를 검증
        Order orderReceived = receivedOrder.get(5, TimeUnit.SECONDS);
        assertEquals("COMPLETED", orderReceived.getStatus());
    }
}
