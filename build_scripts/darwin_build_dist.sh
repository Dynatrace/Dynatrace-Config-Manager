cd ../flask-backend/
sh ./darwin_build_dist.sh

cd ../react-frontend/
sh ./darwin_build_dist.sh

cd ../one-topology/
sh ./darwin_build_dist.sh

cd ..
cd Dynatrace_Config_Manager-darwin_arm64
7z u -tzip ../DTCM_darwin_arm64.zip * -xr\!data -uq0

cd ../build_scripts