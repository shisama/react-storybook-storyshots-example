# Storybook + Storyshotsでコンポーネントの保守可能なUIテストを行う

# TL;DR
- プロジェクト内のコンポーネント一覧を見るためにStorybookを使う
- コンポーネント単位でpropsの値の変更による表示の確認が可能になる
- Storybookのコードが腐らないようにStoryshotsを使ってスナップショットテストする
- storybook demo: https://shisama.dev/react-storybook-storyshots-example/public/

## 今回の例コンポーネント

今回の記事ではサンプルとして以下の小さなコンポーネントを例に進めたいと思います。

```jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-regular-svg-icons';

type Props = {
  count: number;
  onClick: React.MouseEventHandler;
};

export const Like = ({ count, onClick }: Props) => {
  return (
    <>
      <div onClick={onClick}>
        <FontAwesomeIcon icon={faHeart} />
        {count}
      </div>
    </>
  );
};
```

## Storybook
### pros
コンポーネントを一覧をブラウジングできるツール。
コンポーネントごとにレビューするときとかにも使える
渡すpropsによって表示が変わるコンポーネントとかは複数パターンをイッキ見できて便利
### cons
storybook用のコードの保守コスト
ビルドしてプロダクションでしか確認しないメンバーがいるとstorybookのコードは腐る。コンポーネントを修正したときにstorybookのコードは後回しとかになって保守されなくなっていく。
コンポーネントの一覧は表示できるが、自動テストするものではないため人力での確認となる

## Storyshots
### pros
storybookのコードを使いスナップショットテストが可能になる。
storybook用に書いたコードが実質テストコードとなるため、テストコードとstorybookのコードを二重管理しなくて良い。
コンポーネントを修正したときにstorybookのコードも修正しないとスナップショットテストが失敗する
### cons
Storyshots自体の保守が発生する
Storyshotsの設定が必要

### 手順
#### Storybook導入(React用)
[Storybook for React](https://storybook.js.org/docs/guides/guide-react/)

```
npx -p @storybook/cli sb init --type react
```

`@storybook/cli`はstorybookの設定などを自動で行ってくれるCLIツールです。  

#### Storybook + TypeScript + React
StorybookはBabelを使ってトランスパイルを行います。そのため、TypeScript用にBabelの設定を行う必要があります。

BabelでTypeScriptやReactをトランスパイルするためのpresetをインストールします。

```
npm i -D @babel/core @babel/preset-typescript @babel/preset-react
```

次にBabelの変換を行うための`.babelrc`をプロジェクト直下に作ります。

```json
{
  "presets": [
    "@babel/preset-typescript",
    "@babel/preset-react"
  ]
}
```

次にStorybookでTypeScriptのビルドを行うために`.storybook`配下に`webpack.config.js`を作成します。

```js
module.exports = ({ config }) => {
  config.module.rules.push({
    test: /\.tsx?$/,
    use: [
      {
        loader: require.resolve('ts-loader')
      },
      {
        loader: require.resolve('react-docgen-typescript-loader')
      }
    ]
  });
  config.resolve.extensions.push('.ts', '.tsx');
  return config;
};
```

react-docgen-typescript-loaderをインストールしなければいけません。

```
npm i -D react-docgen-typescript-loader
```

react-docgen-typescript-loaderはTypeScriptで作られたReactコンポーネントをドキュメント化するのに必要なWebpackのloaderです。  
[GitHub - strothj/react-docgen-typescript-loader: Webpack loader to generate docgen information from Typescript React components.](https://github.com/strothj/react-docgen-typescript-loader)

最後にコンポーネントのStorybook用の表示ファイルを作成します。
前述の`@storybook/cli`によって`stories/index.stories.js`が作成されています。  
このファイルをLikeコンポーネント用に書き換えましょう。
ファイル名は任意です。`index.stories.tsx`でもいいですが、`Like.tsx`や`Like.stories.tsx`などわかりやすい名前にしておくといいかと思います。  
ファイル名は任意ですが、拡張子は`.tsx`にしてください。  
例えば、Like数が`0`の場合と`1`の場合の表示を確認してみましょう。

```jsx
import React from "react";

import { Like } from "../src/components/Like";

export default {
  title: 'Like'
};

export const zero = () => <Like count={0} onClick={() => {}} />;
export const one = () => <Like count={1} onClick={() => {}} />;

```

前述の`@storybook/cli`によって`.storybook/config.js`が作成されています。  
Storybookで前述の`Like.stories.tsx`を読み込ませるためにこの`.storybook/config.js`を編集します。

```js
import { configure } from '@storybook/react';

// このrequire.contextで読み込む対象の拡張子を.jsから.tsxに編集
// const req = require.context('../stories', true, /\.stories\.js?$/);
const req = require.context('../stories', true, /\.stories\.tsx?$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
```

ここまで設定するとStorybookは実行可能となりLikeのstoriesがブラウザで表示できます。

```
npm run storybook
```

[![Image from Gyazo](https://i.gyazo.com/23ab51b7a7cf875b40c4c9b07d0b8fa6.png)](https://gyazo.com/23ab51b7a7cf875b40c4c9b07d0b8fa6)

#### Storyshots導入
[storybook/addons/storyshots/storyshots-core at master · storybookjs/storybook · GitHub](https://github.com/storybookjs/storybook/tree/master/addons/storyshots/storyshots-core)

Storyshotsの導入の前にテストランナーをインストールします。  
今回はJestを使います。  
[Getting Started · Jest](https://jestjs.io/docs/ja/getting-started)

```
npm i -D jest babel-jest 
```

TypeScriptを使う場合は`@babel/preset-typescript`も必要。
BabelでTypeScriptをトランスパイルしているとJestでテストを実行する時に型検査をしてくれません。  
Jest実行時に型検査をしたい場合はts-jestを使う必要がありますが、これまで見てきたようにStorybookはBabelに依存しています。Storyshotsも同様にBabelで設定した方が簡単だと個人的には思います。  

次にStoryshotsをインストールします。  

```
npm i -D @storybook/addon-storyshots
```

次に[babel-plugin-require-context-hook](https://github.com/smrq/babel-plugin-require-context-hook)をインストールします。  

```
npm i -D babel-plugin-require-context-hook
```

`babel-plugin-require-context-hook/register`を実行するために`.jest/register-context.ts`というファイルを作ります。

```js
import registerRequireContextHook from 'babel-plugin-require-context-hook/register';
registerRequireContextHook();
```

次にStoryshotsのテストファイル`stories/__tests__/Like.test.ts`を作成します。  

```js
import initStoryshots from '@storybook/addon-storyshots';

initStoryshots();
```

次にJestの設定ファイル`jest.config.js`を作成します。`setupFiles`はJest実行時に前述の`.jest/register-context.ts`を、`testMatch`はStoryshotsのテストファイルを読み込むようにします。  

```js
module.exports = {
  setupFiles: ["<rootDir>/.jest/register-context.ts"],
  testMatch: ["<rootDir>/stories/__tests__/*.test.ts"]
};
```

Jestの設定ファイルの各プロパティの詳細については[Configuring Jest · Jest](https://jestjs.io/docs/en/configuration.html)をご確認ください。  

最後にBabelにpluginを設定します。

```json
{
  "presets": ["..."],
  "plugins": ["..."],
  "env": {
    "test": {
      "plugins": ["require-context-hook"]
    }
  }
}
```

次に`jest.config.js`から読み込むファイルの変換を行うために`@babel/preset-env`をインストールします。  

```
npm i -D @babel/preset-env
```

`@babel/preset-env`を`.babelrc`に設定します。

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": "current"
        }
      }
    ],
    "@babel/preset-typescript",
    "@babel/preset-react"
  ],
  ...
}
```

ここまでで`.babelrc`は以下のようになっています。

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": "current"
        }
      }
    ],
    "@babel/preset-typescript",
    "@babel/preset-react"
  ],
  "env": {
    "test": {
      "plugins": ["require-context-hook"]
    }
  }
}
```

Storyshotsは[react-test-renderer](https://github.com/facebook/react/tree/master/packages/react-test-renderer)に依存しているので、Reactで動かすためにはreact-test-rendererをインストールする必要があります。

```
npm i -D react-test-renderer
```

## 実行
Jestでのテストを実行するために`package.json`に`test`タスクを追加します。

```json
  "scripts": {
    ...
    "test": "jest"
    ...
  },
```

実行は以下のコマンドから行えます。

```
npm test
```

## 実行結果

実行すると`stories/__tests__/__snapshots__`というディレクトリが作成され、`Like.test.ts.snap`が作成されます。

```jsx
// Jest Snapshot v1, https://goo.gl/fbAQLP

exports[`Storyshots Like 0 1`] = `
<div
  onClick={[Function]}
>
  <svg
    aria-hidden="true"
    className="svg-inline--fa fa-heart fa-w-16 "
    data-icon="heart"
    data-prefix="far"
    focusable="false"
    role="img"
    style={Object {}}
    viewBox="0 0 512 512"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M458.4 64.3C400.6 15.7 311.3 23 256 79.3 200.7 23 111.4 15.6 53.6 64.3-21.6 127.6-10.6 230.8 43 285.5l175.4 178.7c10 10.2 23.4 15.9 37.6 15.9 14.3 0 27.6-5.6 37.6-15.8L469 285.6c53.5-54.7 64.7-157.9-10.6-221.3zm-23.6 187.5L259.4 430.5c-2.4 2.4-4.4 2.4-6.8 0L77.2 251.8c-36.5-37.2-43.9-107.6 7.3-150.7 38.9-32.7 98.9-27.8 136.5 10.5l35 35.7 35-35.7c37.8-38.5 97.8-43.2 136.5-10.6 51.1 43.1 43.5 113.9 7.3 150.8z"
      fill="currentColor"
      style={Object {}}
    />
  </svg>
  0
</div>
`;

exports[`Storyshots Like 1 1`] = `
<div
  onClick={[Function]}
>
  <svg
    aria-hidden="true"
    className="svg-inline--fa fa-heart fa-w-16 "
    data-icon="heart"
    data-prefix="far"
    focusable="false"
    role="img"
    style={Object {}}
    viewBox="0 0 512 512"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M458.4 64.3C400.6 15.7 311.3 23 256 79.3 200.7 23 111.4 15.6 53.6 64.3-21.6 127.6-10.6 230.8 43 285.5l175.4 178.7c10 10.2 23.4 15.9 37.6 15.9 14.3 0 27.6-5.6 37.6-15.8L469 285.6c53.5-54.7 64.7-157.9-10.6-221.3zm-23.6 187.5L259.4 430.5c-2.4 2.4-4.4 2.4-6.8 0L77.2 251.8c-36.5-37.2-43.9-107.6 7.3-150.7 38.9-32.7 98.9-27.8 136.5 10.5l35 35.7 35-35.7c37.8-38.5 97.8-43.2 136.5-10.6 51.1 43.1 43.5 113.9 7.3 150.8z"
      fill="currentColor"
      style={Object {}}
    />
  </svg>
  1
</div>
`;
```

