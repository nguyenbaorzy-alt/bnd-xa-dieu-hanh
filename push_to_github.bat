@echo off
chcp 65001 >nul
title Đẩy mã nguồn lên GitHub - UBND Xã Tân Triều
cd /d "%~dp0"

set "PATH=C:\Program Files\Git\cmd;%PATH%"

echo ===================================================
echo   ĐANG TẢI MÃ NGUỒN LÊN GITHUB:
echo   https://github.com/nguyenbaorzy-alt/bnd-xa-dieu-hanh
echo ===================================================
echo.
echo Đang kết nối và đẩy mã nguồn lên nhánh main...
echo (Cửa sổ trình duyệt GitHub sẽ bật lên, vui lòng chọn 'Sign in with your browser')
echo.

git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo   ✓ ĐÃ TẢI LÊN GITHUB THÀNH CÔNG 100%!
    echo   Bạn có thể mở trình duyệt xem kho lưu trữ.
    echo ===================================================
) else (
    echo.
    echo ===================================================
    echo   ✕ CÓ LỖI XẢY RA HOẶC CHƯA XÁC THỰC TÀI KHOẢN.
    echo ===================================================
)

echo.
pause
