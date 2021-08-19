module.exports =
{
	env:
	{
		browser: true,
		es6: true,
		node: true
	},
	plugins:
		[
			'import',
			'react',
			'jsx-control-statements'
		],
	extends:
		[
			'eslint:recommended',
			'plugin:react/recommended',
			'plugin:jsx-control-statements/recommended'
		],
	settings:
	{
		react:
		{
			pragma: 'React',
			version: '16'
		}
	},
	parserOptions:
	{
		ecmaVersion: 2018,
		sourceType: 'module',
		ecmaFeatures:
		{
			impliedStrict: true,
			jsx: true
		}
	},
	rules:
	{
		'strict': 2,
		'valid-typeof': 2,
		'eol-last': 2,
		'yoda': 2,
		// eslint-plugin-import options.
		'import/extensions': 2,
		'import/no-duplicates': 2,
		// eslint-plugin-react options.
		'react/display-name': [2, { ignoreTranspilerName: false }],
		'react/forbid-prop-types': 0,
		'react/jsx-boolean-value': 2,
		'react/jsx-closing-bracket-location': 2,
		'react/jsx-curly-spacing':0,
		'react/jsx-equals-spacing': 2,
		'react/jsx-handler-names': 2,
		'react/jsx-key': 2,
		'react/jsx-max-props-per-line': 0,
		'react/jsx-no-bind': 0,
		'react/jsx-no-duplicate-props': 2,
		'react/jsx-no-literals': 0,
		'react/jsx-no-undef': 0,
		'react/jsx-pascal-case': 2,
		'react/jsx-sort-prop-types': 0,
		'react/jsx-sort-props': 0,
		'react/jsx-uses-react': 2,
		'react/jsx-uses-vars': 2,
		'react/no-danger': 2,
		'react/no-deprecated': 2,
		'react/no-did-mount-set-state': 2,
		'react/no-did-update-set-state': 2,
		'react/no-direct-mutation-state': 2,
		'react/no-is-mounted': 2,
		'react/no-multi-comp': 0,
		'react/no-set-state': 0,
		'react/no-string-refs': 0,
		'react/no-unknown-property': 2,
		'react/prefer-es6-class': 2,
		'react/prop-types': [2, { skipUndeclared: true }],
		'react/react-in-jsx-scope': 2,
		'react/self-closing-comp': 2,
		'react/sort-comp': 0,
		'react/jsx-wrap-multilines': [2,
			{
				declaration: false,
				assignment: false,
				return: true
			}]
	}
};
