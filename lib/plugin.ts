///<reference path="../node_modules/postcss/postcss.d.ts" />
import postcss from 'postcss';

const plugin = 'postcss-nested-vars';

export default postcss.plugin<PostCssNestedVars.Options>(plugin, (options = <any>{}) => {

	options.logLevel = options.logLevel || 'error';

	const errorContext = { plugin };
	const specialSearchValue = /\$\(([\w\d-_]+)\)/g;

	const log: (message: string, node: postcss.Node, result: postcss.Result) => void = {
		error(message: string, node: postcss.Node) {
			throw node.error(message, errorContext);
		},
		warn(message: string, node: postcss.Node, result: postcss.Result) {
			node.warn(result, message);
		},
		silent() {
			// noop
		}
	}[options.logLevel];

	if (!log) {
		throw new Error(`Invalid logLevel: ${options.logLevel}`);
	}

	const globals = {};
	if (options.globals) {
		Object.keys(options.globals).forEach(key => {
			globals[key] = [options.globals[key]];
		});
	}

	return (root, result) => {
		walk(root, result, globals);
	};

	function walk(container: postcss.Container, result: postcss.Result, vars: Object) {
		const containerVars = {};

		container.walk(node => {
			if (node.type === 'rule') {
				resolveContainer(<postcss.Container>node, 'selector');
				return;
			}
			if (node.type === 'atrule') {
				resolveContainer(<postcss.Container>node, 'params');
				return;
			}
			if (node.type === 'decl') {
				resolveDeclaration(<postcss.Declaration>node);
				return;
			}
		});

		Object.keys(containerVars).forEach(varName => {
			vars[varName].pop();
		});

		function resolveContainer(container2: postcss.Container, prop: string) {
			if (container2[prop].indexOf('$(') !== -1) {
				replaceAllVars(container2, prop, specialSearchValue);
			}
			walk(container2, result, vars);
		}

		function resolveDeclaration(decl: postcss.Declaration) {
			if (decl.prop.indexOf('$(') !== -1) {
				replaceAllVars(decl, 'prop', specialSearchValue);
			}
			if (/^\$(?!\()/.test(decl.prop)) {
				const m = decl.prop.match(/^\$([\w\d-_]+)$/);
				const varName = m && m[1];
				const stack = vars[varName];
				if (!stack) {
					vars[varName] = [];
				}
				if (!containerVars[varName]) {
					containerVars[varName] = true;
					vars[varName].push(decl.value);
				} else {
					stack[stack.length - 1] = decl.value;
				}
				decl.remove();
				return;
			}
			if (decl.value.indexOf('$') !== -1) {
				replaceAllVars(decl, 'value', /\$([\w\d-_]+)/g);
			}
		}

		function replaceAllVars(obj: Object, prop: string, searchValue: RegExp) {
			obj[prop] = obj[prop].replace(searchValue, (m, varName: string) => {
				const stack = vars[varName];
				if (!stack || !stack.length) {
					log(`Undefined variable: ${varName}`, <postcss.Node>obj, result);
					return `$${varName}`;
				}
				return stack[stack.length - 1];
			});
		}
	}
});

export module PostCssNestedVars {
	export interface Options {
		/**
		 * Global variables that can be referenced from any context.
		 */
		globals?: Object;
		/**
		 * If a variable cannot be resolved, this specifies how to handle it.
		 * Possible values: error, warn, silent. `warn` and `silent` modes will
		 * preserve the original values (e.g., `$foo` will remain `$foo`).
		 */
		logLevel?: string;
	}
}
