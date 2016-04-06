default: install
install:
	npm install
	node ./quickstart.js
docs:
	rm -rf ./out
	jsdoc -R ./README.md js
temp:
	if [ -a /etc/arch-release ]; then echo hi; fi;
docker:
	sudo docker build -t johnsmith0508/cubes .
clean:
	rm -rf ./.sass-cache ./out
css:
	sass ./scss/stylesheet.scss ./css/stylesheet.css
list:
	@echo "##### make options #####"
	@echo "run make ___ :"
	@echo " - install"
	@echo " - docker"
	@echo " - docs"
	@echo " - clean"
	@echo " - css"
	@echo " - list"

