#!/bin/bash

sudo apt-get install git python3-dev libxml2-dev libxslt1-dev libz-dev python3-pip python3-venv

cd ./congress

python3 - m venv env
source env/bin/activate

pip install .

deactivate

cd ..
