cd ../flask-backend/
sh ./linux_build_dist.sh

cd ../react-frontend/
sh ./linux_build_dist.sh

cd ..
cd Dynatrace_Config_Manager-linux64
7z u -tzip ../DTCM_linux64.zip * -xr\!data -uq0

cd ../build_scripts