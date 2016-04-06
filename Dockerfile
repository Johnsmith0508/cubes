FROM	centos:centos6

RUN	yum install -y epel-release

RUN	yum install -y node npm redis

COPY	package.json /src/package.json

RUN	cd /src; npm install

RUN	service redis start

COPY	. /src

EXPOSE	3000

CMD	["node","/src/main.js"]

