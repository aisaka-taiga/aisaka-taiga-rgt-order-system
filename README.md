# 실시간 주문 처리 시스템

이 프로젝트는 **Spring Boot**와 **React**를 활용하여 실시간 주문을 처리하는 시스템입니다.  
웹소켓을 사용하여 주문을 실시간으로 전송하고, 대시보드에서 확인할 수 있습니다.

## 주요 기능

- **주문 입력 및 전송** (React + Spring Boot REST API)
- **실시간 주문 처리 및 업데이트** (WebSocket + STOMP)
- **주문 목록 대시보드** (React + MUI)

---

## 🛠 개발 환경

### **Backend**
- **Java 17**
- **Spring Boot**
- **Spring WebSocket (STOMP)**
- **Lombok**
- **JUnit5, Mockito** (테스트)

### **Frontend**
- **React 18**
- **Material-UI (MUI)**
- **SockJS, STOMP.js**

---

## 🚀 설치 및 실행 방법

### **Backend (Spring Boot)**
1. 프로젝트 클론  
```bash
git clone https://github.com/your-repo/rgt-order-system.git
cd rgt-order-system/backend
./gradlew bootRun
```
### **Frontend (React)**
```
cd ../frontend
npm install
npm start
```

## API 엔드포인트

### **주문 관련 REST API**

| 메서드 | 엔드포인트     | 설명        |
|--------|--------------|------------|
| **POST** | `/api/order`  | 주문 생성  |
| **GET**  | `/api/orders` | 주문 목록 조회 |

### **WebSocket 엔드포인트**

| 채널           | 설명                |
|---------------|--------------------|
| `/ws`         | WebSocket 연결      |
| `/app/order`  | 주문 전송 채널      |
| `/topic/orders` | 실시간 주문 구독 |

## 개선할 점

- Kafka를 이용한 메시지 큐 적용
현재 WebSocket을 통한 실시간 주문 처리만 지원하지만, Kafka를 활용하여 메시지 큐를 적용하면 주문 데이터를 비동기적으로 처리하고 확장성을 높일 수 있음.
- Redis를 활용한 캐싱
주문 목록 조회 시 데이터베이스 부하를 줄이기 위해 Redis를 활용한 캐싱을 적용하면 성능 개선 가능.


