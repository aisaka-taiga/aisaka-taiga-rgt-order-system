package com.rgt.order_system.controller;

import com.rgt.order_system.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class OrderWebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(OrderWebSocketController.class);
    private final SimpMessagingTemplate messagingTemplate;

    public OrderWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/order")
    public void broadcastOrder(Order order) {
        try {
            logger.info("새로운 주문 방송: 음식={}, 수량={}, 상태={}",
                    order.getFoodName(), order.getQuantity(), order.getStatus());

            messagingTemplate.convertAndSend("/topic/orders", order);
        } catch (Exception e) {
            logger.error("주문 방송 중 오류 발생: {}", e.getMessage(), e);
            messagingTemplate.convertAndSend("/topic/errors", "주문 처리 중 오류가 발생했습니다.");
        }
    }
}
