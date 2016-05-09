STYLE ?= new
default: install
install:
	npm install
	node ./quickstart.js
	if [ -a /etc/arch-release ]; then sudo cp ./cubeserver.service /etc/systemd/system; fi;
docs:
	rm -rf ./docs
	jsdoc -c docConf.json -t ./node_modules/ink-docstrap/template/

temp:
	if [ -a /etc/arch-release ]; then echo hi; fi;
docker:
	sudo docker build -t johnsmith0508/cubes .
clean:
	rm -rf ./.sass-cache ./out
.PHONY: css docs
css:
	sass ./scss/stylesheet.scss ./css/stylesheet.css
coverage:
	./test/coverage.py ./js/GUI.js
build:
	@cd js && \
	java -jar ../../compiler.jar --js GUI.js --create_source_map ./GUI.min.js.map --source_map_format=V3 --js_output_file GUI.min.js && \
	echo "//# sourceMappingURL=./GUI.min.js.map" >> ./GUI.min.js
targets:
	@echo "##### make options #####"
	@echo "run make ___ :"
	@echo " - install"
	@echo " - docker"
	@echo " - docs"
	@echo " - clean"
	@echo " - css"
	@echo " - targets"
	@echo " - coverage"
