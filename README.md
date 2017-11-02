# postcss-nested-vars

<img align="right" width="135" height="95"
	title="Philosopher’s stone, logo of PostCSS"
	src="http://postcss.github.io/postcss/logo-leftp.png">

[![NPM version](http://img.shields.io/npm/v/postcss-nested-vars.svg?style=flat)](https://www.npmjs.org/package/postcss-nested-vars)
[![npm license](http://img.shields.io/npm/l/postcss-nested-vars.svg?style=flat-square)](https://www.npmjs.org/package/postcss-nested-vars)
[![Travis Build Status](https://img.shields.io/travis/jedmao/postcss-nested-vars.svg)](https://travis-ci.org/jedmao/postcss-nested-vars)
[![codecov](https://codecov.io/gh/jedmao/postcss-nested-vars/branch/master/graph/badge.svg)](https://codecov.io/gh/jedmao/postcss-nested-vars)
[![Dependency Status](https://gemnasium.com/badges/github.com/jedmao/postcss-nested-vars.svg)](https://gemnasium.com/github.com/jedmao/postcss-nested-vars)

[![npm](https://nodei.co/npm/postcss-nested-vars.svg?downloads=true)](https://nodei.co/npm/postcss-nested-vars/)

[PostCSS](https://github.com/postcss/postcss) plugin for nested [Sass-like](http://sass-lang.com/guide#topic-2) variables.

## Introduction

Instead of assuming all variables are global, this plugin assumes the variable for which you are looking can be found in the current nested container context or in one of its ancestors (i.e., root, rule or at-rule).

```scss
$color: red;
a {
	color: $color;
	$color: white;
	color: $color;
	b {
		color: $color;
		$color: blue;
		color: $color;
	}
	color: $color;
}
```

Transpiles into:

```scss
a {
	color: red;
	color: white;
	b {
		color: white;
		color: blue;
	}
	color: white;
}
```

You can also target rule selectors, at-rule params and declaration properties with a special `$(varName)` syntax, same as [`postcss-simple-vars`](https://github.com/postcss/postcss-simple-vars):

```css
$bar: BAR;
$(bar) {}
@media foo$(bar) {
	foo-$(bar)-baz: qux;
}
```

Transpiles into:

```css
BAR {}
@media fooBAR {
	foo-BAR-baz: qux;
}
```

### Related Projects

- [`postcss-simple-vars`](https://github.com/postcss/postcss-simple-vars)
- [`postcss-advanced-vars`](https://github.com/jonathantneal/postcss-advanced-variables)

## Installation

```
$ npm install postcss-nested-vars
```

## Usage

### JavaScript

```js
postcss([ require('postcss-nested-vars')(/* options */) ]);
```

### TypeScript

```ts
import * as postcssNestedVars from 'postcss-nested-vars';

postcss([ postcssNestedVars(/* options */) ]);
```

## Options

### globals

Type: `Object`<br>
Required: `false`<br>
Default: `{}`

Global variables that can be referenced from any context.

### logLevel

Type: `string: <error|warn|silent>`<br>
Required: `false`<br>
Default: `error`

If a variable cannot be resolved, this specifies how to handle it. `warn` and `silent` modes will preserve the original values (e.g., `$foo` will remain `$foo`).

## Testing

Run the following command:

```
$ npm test
```

This will build scripts, run tests and generate a code coverage report. Anything less than 100% coverage will throw an error.

### Watching

For much faster development cycles, run the following commands in 2 separate processes:

```
$ npm run build:watch
```

Compiles TypeScript source into the `./dist` folder and watches for changes.

```
$ npm run watch
```

Runs the tests in the `./dist` folder and watches for changes.
