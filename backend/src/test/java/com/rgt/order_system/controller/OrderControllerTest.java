package com.rgt.order_system.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class) // JUnit 5 Mockito
public class OrderControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private OrderController orderController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this); // Mockito 초기화
        mockMvc = MockMvcBuilders.standaloneSetup(orderController).build(); // MockMvc 설정
    }

    @Test
    void testCreateOrder() throws Exception {
        String orderJson = """
        {
            "foodName": "Pizza",
            "quantity": 2,
            "status": "ORDERED"
        }
        """;

        mockMvc.perform(post("/api/order")
                        .contentType(MediaType.APPLICATION_JSON)
                        .characterEncoding("UTF-8")  // 요청 인코딩 설정
                        .content(orderJson))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/plain;charset=UTF-8"))  // 응답 인코딩 확인
                .andExpect(content().string("주문이 접수되었습니다."));
    }

}
