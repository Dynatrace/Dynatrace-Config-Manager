@echo off

cd ../flask-backend/
call win_build_dist.bat

cd ../react-frontend/
call win_build_dist.bat

cd ..
7z u -tzip Dynatrace_Config_Manager-win64.zip Dynatrace_Config_Manager-win64 -xr!data -uq0

cd build_scripts