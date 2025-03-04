import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { TextField, Button, Typography, Stack, CircularProgress } from "@mui/material";

const OrderWebSocket = () => {
    const [stompClient, setStompClient] = useState(null);
    const [orders, setOrders] = useState([]);
    const [foodName, setFoodName] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const socket = new SockJS("http://localhost:8080/ws");
        const client = Stomp.over(socket);

        client.connect({}, () => {
            console.log("WebSocket 연결 성공");

            client.subscribe("/topic/orders", (message) => {
                const orderData = JSON.parse(message.body);
                console.log("주문 응답:", orderData);
                setOrders((prevOrders) => [...prevOrders, orderData]);
                setLoading(false);
            });

            client.subscribe("/topic/errors", (message) => {
                console.error("오류 발생:", message.body);
                setLoading(false);
            });

            setStompClient(client);
        });

        return () => {
            if (client) {
                client.disconnect();
                console.log("WebSocket 연결 종료");
            }
        };
    }, []);

    const sendOrder = () => {
        if (stompClient && foodName.trim() !== "") {
            setLoading(true);
            const order = {
                id: new Date().getTime(),
                foodName,
                quantity,
                status: "주문 접수"
            };
            stompClient.send("/app/order", {}, JSON.stringify(order));
            console.log("주문 전송:", order);
            setFoodName("");
            setQuantity(1);
        }
    };

    return (
        <Stack spacing={2} sx={{ maxWidth: 400, margin: "auto", padding: 3, textAlign: "center" }}>
            <Typography variant="h5">음식 주문</Typography>
            <TextField
                label="음식 이름"
                variant="outlined"
                fullWidth
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
            />
            <TextField
                label="수량"
                type="number"
                variant="outlined"
                fullWidth
                inputProps={{ min: 1 }}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            />
            <Button
                variant="contained"
                color="primary"
                onClick={sendOrder}
                disabled={!foodName.trim() || loading}
            >
                {loading ? <CircularProgress size={24} /> : "주문하기"}
            </Button>
        </Stack>
    );
};

export default OrderWebSocket;
