package com.rgt.order_system.controller;

import com.rgt.order_system.model.Order;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@RestController
public class OrderWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final List<Order> orders = new CopyOnWriteArrayList<>();
    private final AtomicLong orderIdGenerator = new AtomicLong(1);
    private static final int DEFAULT_PAGE_SIZE = 10;

    public OrderWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/order")
    public void handleOrder(Order order) {
        try {
            // 새로운 주문에 고유 ID 할당
            order.setId(orderIdGenerator.getAndIncrement());

            // WebSocket을 통해 받은 주문을 주문 목록에 추가
            orders.add(order);
            log.info("새로운 주문이 접수되었습니다: 아이디={}, 음식={}, 수량={}, 상태={}",
                    order.getId(), order.getFoodName(), order.getQuantity(), order.getStatus());

            // 주문을 클라이언트에게 다시 브로드캐스트 (topic/orders로 전송)
            messagingTemplate.convertAndSend("/topic/orders", order);
        } catch (Exception e) {
            log.error("주문 처리 중 오류 발생: {}", e.getMessage(), e);
            messagingTemplate.convertAndSend("/topic/errors", "주문 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 모든 주문 목록을 반환하는 API
     * @return 전체 주문 목록
     */
    @GetMapping("/api/getallorders")
    public List<Order> getAllOrders() {
        return new ArrayList<>(orders); // 방어적 복사본 반환
    }

    /**
     * 주문 목록 페이지네이션 API - 최신순(ID 내림차순) 정렬
     * @param page 페이지 번호 (0부터 시작)
     * @param size 페이지 크기
     * @return 페이지네이션된 주문 목록
     */
    @GetMapping("/api/orders")
    public List<Order> getOrdersWithPagination(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {

        // 페이지 및 크기 유효성 검사
        if (page < 0) page = 0;
        if (size <= 0) size = 10; // DEFAULT_PAGE_SIZE 값을 직접 10으로 설정

        List<Order> sortedOrders = new ArrayList<>(orders);

        // 최신 주문이 먼저 오도록 ID 기준 내림차순 정렬
        sortedOrders.sort((a, b) -> Long.compare(b.getId(), a.getId()));

        int totalElements = sortedOrders.size();
        int start = Math.min(page * size, totalElements);
        int end = Math.min(start + size, totalElements);

        log.info("Pagination - page: {}, size: {}, start: {}, end: {}, total: {}",
                page, size, start, end, totalElements);

        if (start >= totalElements) {
            return Collections.emptyList();
        }

        return sortedOrders.subList(start, end);
    }

    /**
     * 최신 주문 상태 API - 특정 ID보다 큰 주문만 반환
     * @param lastId 마지막으로 받은 주문 ID (이것보다 큰 ID의 주문만 반환)
     * @return 새로운 주문 목록
     */
    @GetMapping("/api/orders/since")
    public List<Order> getOrdersSince(@RequestParam(value = "lastId", defaultValue = "0") long lastId) {
        List<Order> newOrders = new ArrayList<>();

        for (Order order : orders) {
            if (order.getId() > lastId) {
                newOrders.add(order);
            }
        }

        // ID 기준 내림차순 정렬
        newOrders.sort((a, b) -> Long.compare(b.getId(), a.getId()));

        log.info("Fetching orders since ID: {}, found: {} new orders", lastId, newOrders.size());
        return newOrders;
    }
}