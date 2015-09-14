///<reference path="../typings/tsd.d.ts" />
import { expect } from 'chai';
import postcss from 'postcss';
import { PostCssNestedVars, default as plugin } from '../lib/plugin';

// ReSharper disable WrongExpressionStatement
describe('postcss-nested-vars plugin', () => {

	it('transpiles the readme examples into the expected results', () => {
		check(
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
		check(
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
	});

	it('resolves a var declared in the root container', () => {
		check(
			`$foo: FOO;
			a {
				bar: $foo;
			}`,
			`a {
				bar: FOO;
			}`
		);
	});

	it('resolves vars in the same declaration value', () => {
		check(
			`$foo: FOO;
			$bar: BAR;
			a {
				baz: $foo $bar $foo baz;
			}`,
			`a {
				baz: FOO BAR FOO baz;
			}`
		);
	});

	it('throws when a referenced var is undefined', () => {
		check(
			`a {
				foo: $bar;
			}`,
			/Undefined variable: bar/
		);
	});

	it('does not resolve a var outside the container\'s ancestors', () => {
		check(
			`a {
				$foo: FOO;
			}
			b {
				bar: $foo;
			}`,
			/Undefined variable: foo/
		);
	});

	it('overrides vars in the same context', () => {
		check(
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
	});

	it('restores an original var after leaving the overridden context', () => {
		check(
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
	});

	it('resolves a var declared and referenced in the same rule', () => {
		check(
			`a {
				$foo: FOO;
				bar: $foo;
			}`,
			`a {
				bar: FOO;
			}`
		);
	});

	it('resolves a deeply nested var', () => {
		check(
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
	});

	it('resolves to the closest var declaration', () => {
		check(
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
	});

	it('resolves a var within a rule selector', () => {
		check(
			`$bar: BAR; foo$(bar)baz {}`,
			`fooBARbaz {}`
		);
	});

	it('resolves a var within an at-rule prelude', () => {
		check(
			`$bar: BAR; @a foo$(bar)baz {}`,
			`@a fooBARbaz {}`
		);
	});

	it('resolves a var within a declaration property', () => {
		check(
			`$bar: BAR;
			a {
				foo$(bar)baz: qux;
			}`,
			`a {
				fooBARbaz: qux;
			}`
		);
	});

	it('ignores comments', () => {
		const comment = '/* $foo */';
		check(comment, comment);
	});

	describe('plugin options', () => {

		describe('globals', () => {

			const globals = { foo: 'bar' };

			it('sets global variables (i.e., can be read in any context)', () => {
				check(
					`foo:$foo`,
					`foo:bar`,
					{ globals }
				);
			});

		});

		describe('logLevel', () => {

			describe('setting: error', () => {

				const logLevel = 'error';

				it('is the default setting', () => {
					check('foo:$foo', /Undefined variable: foo/);
				});

				it('throws when a variable is undefined', () => {
					check('foo:$foo', /Undefined variable: foo/, { logLevel });
				});

			});

			['warn', 'silent'].forEach(logLevel => {

				describe(`setting: ${logLevel}`, () => {

					it('does not throw when a variable is undefined', () => {
						check('foo:$foo', 'foo:$foo', { logLevel });
					});

					it('preserves the original value', () => {
						check('foo:$foo', 'foo:$foo', { logLevel });
					});

				});

			});

			describe('setting: foo', () => {

				const logLevel = 'foo';

				it('throws an invalid logLevel error', () => {
					expect(() => {
						check('', '', { logLevel });
					}).to.throw(/Invalid logLevel/);
				});

			});

		});

	});

	function check(
		actual: string,
		expected?: string|RegExp,
		options?: PostCssNestedVars.Options
	) {
		const processor = postcss().use(plugin(options));
		if (expected instanceof RegExp) {
			expect(() => {
				return processor.process(stripTabs(actual)).css;
			}).to.throw(expected);
			return;
		}
		expect(
			processor.process(stripTabs(actual)).css
		).to.equal(
			stripTabs(<string>expected)
		);
	}

	function stripTabs(input: string) {
		return input.replace(/\t/g, '');
	}
});
