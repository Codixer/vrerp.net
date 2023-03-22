module.exports = {
    'env': {
        'browser': true,
        'es2021': true,
        'node': true
    },
    'extends': [
        'eslint:recommended',
        'plugin:react/recommended'
    ],
    'parserOptions': {
        'ecmaFeatures': {
            'jsx': true
        },
        'ecmaVersion': 12,
        'sourceType': 'module'
    },
    settings: {
        react: {
            pragma: 'h',
            version: 'detect',
        },
    },
    'plugins': [
        'react',
        'react-hooks',
        'cypress'
    ],
    'rules': {
        'react/prop-types': 'off',
        'indent': [
            'error',
            4
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'no-unused-vars': 'off',
        'react-hooks/rules-of-hooks' : 'error',
    }
}
