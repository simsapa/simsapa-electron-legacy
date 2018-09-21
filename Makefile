all:
	@echo "make what?"

elm-dev:
	cd elm && elm-live --dir ../src/static/ --pushstate -- --output ../src/static/elm.js ./src/Main.elm

elm-prod:
	./scripts/build-elm-prod.sh
