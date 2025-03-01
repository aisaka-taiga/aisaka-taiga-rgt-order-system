package com.rgt.order_system.controller;

import com.rgt.order_system.model.Order;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@RestController
public class OrderWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final List<Order> orders = new CopyOnWriteArrayList<>();  // 주문 목록을 저장
    private final AtomicLong orderIdGenerator = new AtomicLong(1);  // 고유한 ID 생성기

    public OrderWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/order")  // WebSocket으로 전달된 메시지를 처리
    public void handleOrder(Order order) {
        try {
            // 새로운 주문에 고유 ID 할당
            order.setId(orderIdGenerator.getAndIncrement());

            // WebSocket을 통해 받은 주문을 주문 목록에 추가
            orders.add(order);
            log.info("새로운 주문이 접수되었습니다: 아이디={}, 음식={}, 수량={}, 상태={}", order.getId(), order.getFoodName(), order.getQuantity(), order.getStatus());

            // 주문을 클라이언트에게 다시 브로드캐스트 (topic/orders로 전송)
            messagingTemplate.convertAndSend("/topic/orders", order);
        } catch (Exception e) {
            log.error("주문 처리 중 오류 발생: {}", e.getMessage(), e);
            messagingTemplate.convertAndSend("/topic/errors", "주문 처리 중 오류가 발생했습니다.");
        }
    }

    // 주문 목록을 반환하는 REST API
    @GetMapping("/api/getallorders")
    public List<Order> getOrders() {
        return orders;  // WebSocket으로 받은 주문 목록을 반환
    }

    @GetMapping("/api/orders")
    public List<Order> get10Orders() {
        int size = 10;  // 최신 10개 데이터로 설정

        // 전체 주문의 개수
        int totalCount = orders.size();

        // 최신 10개만 잘라서 반환
        int start = Math.max(totalCount - size, 0); // 최신 10개를 가져오기 위한 시작 인덱스
        int end = totalCount;  // 끝 인덱스는 전체 주문 수

        // 로그로 start와 end 출력하여 확인
        log.info("Start: {}, End: {}", start, end);

        // 최신 10개 주문 반환
        return orders.subList(start, end); // 내림차순, 오름차순 없이 최신 10개 주문 반환
    }

}
