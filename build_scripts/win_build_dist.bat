@echo off

cd ../flask-backend/
call win_build_dist.bat

cd ../react-frontend/
call win_build_dist.bat

cd ../one-topology/
call win_build_dist.bat

cd ..
cd Dynatrace_Config_Manager-win64
7z u -tzip ../DTCM_win64.zip * -xr!data -uq0

cd ../build_scripts