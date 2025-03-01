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

import static org.junit.jupiter.api.Assertions.assertTrue;

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

    @Test
    void testWebSocketBulkOrders() throws Exception {
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
            Order order = new Order("menu-" + orderId, 1, "PENDING");
            session.send("/app/order", order);

            return true;
        } catch (Exception e) {
            log.error("주문 전송 실패 (orderId={}): {}", orderId, e.getMessage());
            return false;
        }
    }
}