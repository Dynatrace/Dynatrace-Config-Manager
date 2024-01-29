cd ../flask-backend/
pwd
ls
sh ./darwin_build_dist.sh

cd ../react-frontend/
pwd
ls
sh ./darwin_build_dist.sh

cd ../one-topology/
pwd
ls
sh ./darwin_build_dist.sh

cd ..
cd Dynatrace_Config_Manager-darwin_arm64
7z u -tzip ../DTCM_darwin_arm64.zip * -xr\!data -uq0

cd ../build_scripts