@echo off
chcp 65001 >nul
title Đẩy mã nguồn & Công nghệ độc quyền lên GitHub
cd /d "%~dp0"

set "PATH=C:\Program Files\Git\cmd;%PATH%"

echo ================================================================
echo   ĐỒNG BỘ MÃ NGUỒN LÊN GITHUB (NGUYỄN BẢO - BAO-WORK AI™)
echo   Repository: https://github.com/nguyenbaorzy-alt/bnd-xa-dieu-hanh
echo ================================================================
echo.

echo 1. Đang kiểm tra và đóng gói các thay đổi mới nhất...
git add .
git commit -m "update: cap nhat ma nguon he thong dieu hanh va AI kpi studio" 2>nul

echo 2. Đang đẩy dữ liệu lên GitHub nhánh main...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================
    echo   ✓ ĐÃ ĐỒNG BỘ LÊN GITHUB THÀNH CÔNG 100%!
    echo   Link kho lưu trữ: https://github.com/nguyenbaorzy-alt/bnd-xa-dieu-hanh
    echo ================================================================
) else (
    echo.
    echo ================================================================
    echo   ✕ CÓ LỖI XẢY RA KHI ĐẨY DỮ LIỆU. VUI LÒNG KIỂM TRA MẠNG HOẶC TOKEN!
    echo ================================================================
)

echo.
pause
