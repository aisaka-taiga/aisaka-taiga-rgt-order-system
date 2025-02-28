package com.rgt.order_system.controller;

import com.rgt.order_system.model.Order;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api")
public class OrderController {

    private final List<Order> orders = new ArrayList<>();

    @PostMapping("/order")
    public String createOrder(@RequestBody Order order) {
        orders.add(order);
        return "주문이 접수되었습니다.";
    }

    @MessageMapping("/order")
    @SendTo("/topic/orders")
    public List<Order> sendOrders() {
        return orders;
    }
}