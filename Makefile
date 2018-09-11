all:
	@echo "make what?"

elm-dev:
	cd elm && elm-live --dir ../app/static/ --pushstate -- --output ../app/static/elm.js ./src/Main.elm

elm-prod:
	./scripts/build-elm-prod.sh
