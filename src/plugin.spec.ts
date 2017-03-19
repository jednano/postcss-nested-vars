import test, { ContextualTestContext } from 'ava';
import * as postcss from 'postcss';

import * as plugin from './plugin';

test('transpiles the readme examples into the expected results', macro,
	`$color: red;
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
	}`,
	`a {
		color: red;
		color: white;
		b {
			color: white;
			color: blue;
		}
		color: white;
	}`
);

test('transpiles the readme examples into the expected results', macro,
	`$bar: BAR;
	$(bar) {}
	@media foo$(bar) {
		foo-$(bar)-baz: qux;
	}`,
	`BAR {}
	@media fooBAR {
		foo-BAR-baz: qux;
	}`
);

test('resolves a var declared in the root container', macro,
	`$foo: FOO;
	a {
		bar: $foo;
	}`,
	`a {
		bar: FOO;
	}`
);

test('resolves vars in the same declaration value', macro,
	`$foo: FOO;
	$bar: BAR;
	a {
		baz: $foo $bar $foo baz;
	}`,
	`a {
		baz: FOO BAR FOO baz;
	}`
);

test('throws when a referenced var is undefined', macro,
	`a {
		foo: $bar;
	}`,
	/Undefined variable: bar/
);

test('does not resolve a var outside the container\'s ancestors', macro,
	`a {
		$foo: FOO;
	}
	b {
		bar: $foo;
	}`,
	/Undefined variable: foo/
);

test('overrides vars in the same context', macro,
	`a {
		$foo: FOO;
		bar: $foo;
		$foo: BAR;
		baz: $foo;
		b {
			qux: $foo;
			$foo: BAZ;
			corge: $foo;
		}
		garpley: $foo;
		$foo: QUX;
		waldo: $foo;
	}`,
	`a {
		bar: FOO;
		baz: BAR;
		b {
			qux: BAR;
			corge: BAZ;
		}
		garpley: BAR;
		waldo: QUX;
	}`
);

test('restores an original var after leaving the overridden context', macro,
	`a {
		$foo: FOO;
		b {
			$foo: BAR;
			baz: $foo;
		}
		c {
			qux: $foo;
		}
	}`,
	`a {
		b {
			baz: BAR;
		}
		c {
			qux: FOO;
		}
	}`
);

test('resolves a var declared and referenced in the same rule', macro,
	`a {
		$foo: FOO;
		bar: $foo;
	}`,
	`a {
		bar: FOO;
	}`
);

test('resolves a deeply nested var', macro,
	`@a {
		$foo: FOO;
		@b {
			c {
				d {
					bar: $foo;
				}
			}
		}
	}`,
	`@a {
		@b {
			c {
				d {
					bar: FOO;
				}
			}
		}
	}`
);

test('resolves to the closest var declaration', macro,
	`@a {
		$foo: FOO;
		@b {
			$foo: BAR;
			c {
				baz: $foo;
			}
		}
	}`,
	`@a {
		@b {
			c {
				baz: BAR;
			}
		}
	}`
);

test('resolves a var within a rule selector', macro,
	`$bar: BAR; foo$(bar)baz {}`,
	`fooBARbaz {}`
);

test('resolves a var within an at-rule prelude', macro,
	`$bar: BAR; @a foo$(bar)baz {}`,
	`@a fooBARbaz {}`
);

test('resolves a var within a declaration property', macro,
	`$bar: BAR;
	a {
		foo$(bar)baz: qux;
	}`,
	`a {
		fooBARbaz: qux;
	}`
);

test('ignores comments', macro,
	'/* $foo */',
	'/* $foo */'
);

test('option.globals - sets global variables (i.e., can be read in any context)', macro,
	`foo:$foo`,
	`foo:bar`,
	{ globals: { foo: 'bar' }}
);

test('option.logLevel: error - is the default setting', macro,
	'foo:$foo',
	/Undefined variable: foo/
);

test('option.logLevel: error - throws when a variable is undefined', macro,
	'foo:$foo',
	/Undefined variable: foo/,
	{ logLevel: 'error' }
);

['warn', 'silent'].forEach(logLevel => {

		test(`option.logLevel: ${logLevel} - does not throw when a variable is undefined`, macro,
			'foo:$foo',
			'foo:$foo',
			{ logLevel }
		);

		test(`option.logLevel: ${logLevel} - preserves the original value`, macro,
			'foo:$foo',
			'foo:$foo',
			{ logLevel }
		);

});

test('option.logLevel: foo - throws an invalid logLevel error', macro,
	'',
	/Invalid logLevel/,
	{ logLevel: 'foo' }
);

function macro(
	t: ContextualTestContext,
	input: string,
	expected?: string | RegExp,
	options?: plugin.Options
) {
	if (expected instanceof RegExp) {
		t.throws(transpile, expected);
		return;
	}
	t.is(
		transpile(),
		stripTabs(<string>expected)
	);
	function transpile() {
		const processor = postcss([ plugin(options) ]);
		return processor.process(stripTabs(input)).css;
	}
	function stripTabs(input: string) {
		return input.replace(/\t/g, '');
	}
}
