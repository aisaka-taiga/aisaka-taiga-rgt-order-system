package com.rgt.order_system.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${custom.websocket.sockjs.enabled:true}")  // 환경 변수에 따라 SockJS 활성화 여부 설정
    private boolean sockJsEnabled;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        if (sockJsEnabled) {
            registry.addEndpoint("/ws")
                    .setAllowedOrigins("http://localhost:3000")
                    .withSockJS(); // 일반 실행 시 SockJS 사용
        } else {
            registry.addEndpoint("/ws")
                    .setAllowedOrigins("http://localhost:3000"); // 테스트 실행 시 SockJS 제거
        }
    }
}
