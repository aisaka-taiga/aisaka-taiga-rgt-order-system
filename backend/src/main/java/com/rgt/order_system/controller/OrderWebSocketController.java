package com.rgt.order_system.controller;

import com.rgt.order_system.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class OrderWebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(OrderWebSocketController.class);

    @MessageMapping("/order")
    @SendTo("/topic/orders")
    public Order broadcastOrder(Order order) {
        logger.info("📢 새로운 주문 방송: 음식={}, 수량={}, 상태={}",
                order.getFoodName(), order.getQuantity(), order.getStatus());
        return order;
    }
}