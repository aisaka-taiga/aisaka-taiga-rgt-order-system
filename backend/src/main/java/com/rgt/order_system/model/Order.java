package com.rgt.order_system.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Order {
    private Long id;  // index 추가 (주문 고유 ID)
    private String foodName;
    private int quantity;
    private String status; // 주문 상태 필드 추가
}
