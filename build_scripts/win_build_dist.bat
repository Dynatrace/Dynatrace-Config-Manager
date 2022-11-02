@echo off

cd ../flask-backend/
call win_build_dist.bat

cd ../react-frontend/
call win_build_dist.bat

cd ../build_scripts