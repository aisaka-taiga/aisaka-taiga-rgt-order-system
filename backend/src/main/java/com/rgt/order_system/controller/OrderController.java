package com.rgt.order_system.controller;

import com.rgt.order_system.model.Order;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@RestController
@RequestMapping("/api")
public class OrderController {

    private final List<Order> orders = new CopyOnWriteArrayList<>();
    private final SimpMessagingTemplate messagingTemplate;

    public OrderController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping(value = "/order", produces = MediaType.TEXT_PLAIN_VALUE + ";charset=UTF-8")
    public ResponseEntity<String> createOrder(@RequestBody Order order) {
        order.setStatus("접수됨");
        orders.add(order);
        log.info("주문 접수됨: 음식={}, 수량={}", order.getFoodName(), order.getQuantity());

        // WebSocket으로 실시간 주문 정보 전송
        messagingTemplate.convertAndSend("/topic/orders", order);

        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("text/plain;charset=UTF-8"))
                .body("주문이 접수되었습니다.");
    }


    @PutMapping(value = "/order/{index}", produces = "text/plain;charset=UTF-8")
    public String updateOrderStatus(@PathVariable("index") int index, @RequestParam("status") String status) {
        if (index < 0 || index >= orders.size()) {
            return "잘못된 주문 인덱스입니다.";
        }
        orders.get(index).setStatus(status);
        log.info("주문 상태 변경: 음식={}, 상태={}", orders.get(index).getFoodName(), status);

        messagingTemplate.convertAndSend("/topic/orders", orders.get(index));

        return "주문 상태가 업데이트되었습니다.";
    }

    /*
    @GetMapping("/orders")
    public List<Order> getOrders() {
        return orders;
    }
     */
}
