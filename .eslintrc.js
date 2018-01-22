module.exports = {
    "env": {
        "browser": true
    },
    "extends": "eslint-config-airbnb-base",
    "rules": {
        "no-underscore-dangle": 0,
        "no-use-before-define": ["error", { "functions": false, "classes": true }]
    },
    "plugins": [
        "import"
    ]
};