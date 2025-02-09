#!/bin/bash

cd ./congress

python3 -m venv env
source env/bin/activate

cat << 'EOF' > config.yml
output:
  cache: ../cache
  data: ../data
EOF

usc-run govinfo --bulkdata=BILLSTATUS --congress=119
usc-run bills

deactivate

cd ..

./sort.py
