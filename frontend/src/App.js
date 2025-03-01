import React from "react";
import { Container, Box, Typography, Grid, Paper } from "@mui/material";
import Order from "./components/Order"; // 주문 입력 폼
import Dashboard from "./components/Dashboard"; // 실시간 주문 대시보드

function App() {
  return (
    <Container maxWidth="lg">
      <Box textAlign="center" mt={5} mb={3}>
        <Typography variant="h4" fontWeight="bold">
          🍽️ 실시간 주문 시스템
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {/* 주문 입력 폼 */}
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Order />
          </Paper>
        </Grid>

        {/* 실시간 주문 대시보드 */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Dashboard />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default App;
