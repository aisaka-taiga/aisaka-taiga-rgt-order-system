package com.rgt.order_system.controller;

import com.rgt.order_system.model.Order;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@RestController
public class OrderWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final List<Order> orders = new CopyOnWriteArrayList<>();  // 주문 목록을 저장

    public OrderWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/order")  // WebSocket으로 전달된 메시지를 처리
    public void handleOrder(Order order) {
        try {
            // WebSocket을 통해 받은 주문을 주문 목록에 추가
            orders.add(order);
            log.info("새로운 주문이 접수되었습니다: 음식={}, 수량={}, 상태={}", order.getFoodName(), order.getQuantity(), order.getStatus());

            // 주문을 클라이언트에게 다시 브로드캐스트 (topic/orders로 전송)
            messagingTemplate.convertAndSend("/topic/orders", order);
        } catch (Exception e) {
            log.error("주문 처리 중 오류 발생: {}", e.getMessage(), e);
            messagingTemplate.convertAndSend("/topic/errors", "주문 처리 중 오류가 발생했습니다.");
        }
    }

    // 주문 목록을 반환하는 REST API
    @GetMapping("/api/orders")
    public List<Order> getOrders() {
        return orders;  // WebSocket으로 받은 주문 목록을 반환
    }
}
