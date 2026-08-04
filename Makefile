.PHONY: dev build typecheck clean format deploy

dev:
	pnpm dev

build:
	pnpm build

typecheck:
	tsc --noEmit

clean:
	rm -rf dist

format:
	pnpm format

deploy: build
	rsync -r --delete dist/ bingo:/
