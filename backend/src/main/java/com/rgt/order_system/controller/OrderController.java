package com.rgt.order_system.controller;

import com.rgt.order_system.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);
    private final List<Order> orders = new ArrayList<>();
    private final SimpMessagingTemplate messagingTemplate;

    public OrderController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/order")
    public String createOrder(@RequestBody Order order) {
        order.setStatus("접수됨");
        orders.add(order);
        logger.info("🛒 주문 접수됨: 음식={}, 수량={}", order.getFoodName(), order.getQuantity());

        // WebSocket으로 실시간 주문 정보 전송
        messagingTemplate.convertAndSend("/topic/orders", order);

        return "주문이 접수되었습니다.";
    }

    @PutMapping("/order/{index}")
    public String updateOrderStatus(@PathVariable int index, @RequestParam String status) {
        if (index < 0 || index >= orders.size()) {
            return "잘못된 주문 인덱스입니다.";
        }
        orders.get(index).setStatus(status);
        logger.info("🔄 주문 상태 변경: 음식={}, 상태={}", orders.get(index).getFoodName(), status);

        // 변경된 주문 상태를 WebSocket으로 전송
        messagingTemplate.convertAndSend("/topic/orders", orders.get(index));

        return "주문 상태가 업데이트되었습니다.";
    }

    @GetMapping("/orders")
    public List<Order> getOrders() {
        return orders;
    }
}
