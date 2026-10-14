@echo off
chcp 65001 > nul
echo ===================================================================
echo   HỆ THỐNG ĐIỀU HÀNH CÔNG VĂN VÀ DỊCH VỤ TRỰC TUYẾN CẤP XÃ
echo   ỦY BAN NHÂN DÂN XÃ TÂN TRIỀU - HUYỆN THANH TRÌ - TP. HÀ NỘI
echo ===================================================================
echo.
echo Đang khởi động máy chủ tại cổng 3001...
echo Mở trình duyệt tại địa chỉ: http://localhost:3001
echo.
node server.js
pause
