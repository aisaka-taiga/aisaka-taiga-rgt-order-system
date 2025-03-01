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

### 성능 최적화 기법
- 상태 업데이트 시 함수형 업데이트 사용
- 주문 목록을 저장할 때, CopyOnWriteArrayList를 사용하여 멀티스레드 환경에서도 안전하게 데이터를 처리할 수 있습니다. 이 리스트는 쓰기 작업이 발생할 때마다 내부 배열을 복사하여 변경되므로, 읽기 작업에서는 다른 스레드의 영향을 받지 않고 빠르게 처리할 수 있습니다
- WebSocket을 통해 클라이언트와 서버 간 실시간 메시지를 효율적으로 전송하기 위해, SimpMessagingTemplate을 사용합니다. 이를 통해 STOMP 프로토콜을 기반으로 클라이언트에게 주문 데이터를 전송하고, 메시지 브로드캐스트를 최적화할 수 있습니다.
- 서버에서 최신 10개 주문만을 가져오기 위해, 주문 목록을 일정 범위로 잘라서 반환하는 방식으로 페이지네이션을 적용합니다. 이는 클라이언트에서 요청하는 데이터 양을 제한하여 성능을 최적화합니다.
- 클라이언트 측에서 localStorage를 사용하여 주문 데이터를 저장하고, 웹 페이지를 새로고침하거나 다른 페이지로 이동한 후에도 데이터를 유지할 수 있습니다. 이는 사용자의 경험을 개선하고 서버의 불필요한 요청을 줄이는 데 유용합니다.

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


