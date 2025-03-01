import React, { useState, useCallback } from "react";
import { TextField, Button, Typography, Card, CardContent, Stack } from "@mui/material";

const Order = () => {
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 주문 제출 핸들러 최적화
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      const orderData = { foodName, quantity };

      try {
        const response = await fetch("http://localhost:8080/api/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });

        if (response.ok) {
          setMessage("주문이 접수되었습니다.");
          // 주문 성공 시 입력값 초기화
          setFoodName("");
          setQuantity(1);
        } else {
          setMessage("주문 실패! 다시 시도해주세요.");
        }
      } catch (error) {
        console.error("Error:", error);
        setMessage("서버 오류 발생!");
      } finally {
        setIsSubmitting(false); // 제출 완료 후 버튼 활성화
      }
    },
    [foodName, quantity] // foodName과 quantity만 의존성으로 추가
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          주문하기
        </Typography>
        <Stack spacing={2} component="form" onSubmit={handleSubmit}>
          <TextField
            label="음식 이름"
            variant="outlined"
            fullWidth
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            required
          />
          <TextField
            label="수량"
            type="number"
            variant="outlined"
            fullWidth
            value={quantity}
            onChange={(e) => {
              const newQuantity = e.target.value ? Number(e.target.value) : 1;
              setQuantity(newQuantity);
            }}
            required
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "주문 중..." : "주문하기"}
          </Button>
        </Stack>
        {message && <Typography color="error" mt={2}>{message}</Typography>}
      </CardContent>
    </Card>
  );
};

export default Order;
