@echo off
chcp 65001 > nul
title HỆ THỐNG ĐIỀU HÀNH UBND XÃ TÂN TRIỀU
cd /d "%~dp0"

echo ===================================================================
echo   HỆ THỐNG ĐIỀU HÀNH CÔNG VĂN VÀ DỊCH VỤ TRỰC TUYẾN CẤP XÃ
echo   ỦY BAN NHÂN DÂN XÃ TÂN TRIỀU - HUYỆN THANH TRÌ - TP. HÀ NỘI
echo ===================================================================
echo.
echo Đang mở trình duyệt và khởi động máy chủ tại cổng 3001...
echo Địa chỉ truy cập: http://localhost:3001
echo.

start "" "http://localhost:3001"
node server.js
pause
