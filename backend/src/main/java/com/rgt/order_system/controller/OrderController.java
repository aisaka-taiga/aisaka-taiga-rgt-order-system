package com.rgt.order_system.controller;

import com.rgt.order_system.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);
    private final List<Order> orders = new ArrayList<>();

    @PostMapping("/order")
    public String createOrder(@RequestBody Order order) {
        // 주문 저장
        orders.add(order);

        // 로그 기록
        logger.info("주문 접수됨: 음식={}, 수량={}", order.getFoodName(), order.getQuantity());

        return "주문이 접수되었습니다.";
    }
}
