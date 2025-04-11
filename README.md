# frontend

## Reminder for myself (generate proto .client.ts & .ts)
```bash
cd frontend
mkdir src/generated
#linux
protoc \
  --plugin=./node_modules/.bin/protoc-gen-ts \
  --ts_out=./src/generated \
  --ts_opt=client_generic \
  -I ./src/proto \
  ./src/proto/butler/butler.proto

#windows
protoc ^
  --plugin=protoc-gen-ts=.\node_modules\.bin\protoc-gen-ts.cmd ^
  --ts_out=.\src\generated ^
  --ts_opt=client_generic ^
  -I .\src\proto ^
  .\src\proto\butler\butler.proto
```

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```