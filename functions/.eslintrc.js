module.exports = {
	root: true,
	env: {
		es6: true,
		node: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:import/errors',
		'plugin:import/warnings',
		'plugin:import/typescript',
		'google',
		'plugin:@typescript-eslint/recommended',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: ['tsconfig.json', 'tsconfig.dev.json'],
		sourceType: 'module',
	},
	ignorePatterns: [
		'/lib/**/*', // Ignore built files.
		'/generated/**/*', // Ignore generated files.
	],
	plugins: ['@typescript-eslint', 'import'],
	rules: {
		'quotes': ['error', 'single'],
		'import/no-unresolved': 0,
		'no-tabs': 0,
		'object-curly-spacing': ['error', 'always'],
		'indent': ['error', 'tab'],
		'max-len': [
			'error',
			{
				code: 100,
				ignoreComments: true,
				ignoreStrings: true,
				ignoreTemplateLiterals: true,
			},
		],
		'require-jsdoc': 0,
		'valid-jsdoc': 0,
	},
};
