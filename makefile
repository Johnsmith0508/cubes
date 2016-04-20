default: install
install:
	npm install
	node ./quickstart.js
	if [ -a /etc/arch-release ]; then sudo cp ./cubeserver.service /etc/systemd/system; fi;
docs:
	rm -rf ./docs
	jsdoc -R ./README.md js -d ./docs/
temp:
	if [ -a /etc/arch-release ]; then echo hi; fi;
docker:
	sudo docker build -t johnsmith0508/cubes .
clean:
	rm -rf ./.sass-cache ./out
.PHONY: css docs
css:
	sass ./scss/stylesheet.scss ./css/stylesheet.css
targets:
	@echo "##### make options #####"
	@echo "run make ___ :"
	@echo " - install"
	@echo " - docker"
	@echo " - docs"
	@echo " - clean"
	@echo " - css"
	@echo " - targets"
