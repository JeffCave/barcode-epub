// https://www.npmjs.com/package/mocha-eslint

import lint from 'mocha-eslint';

// Array of paths to lint
// Note: a seperate Mocha test will be run for each path and each file which
// matches a glob pattern
let paths = [
	'tests/**/*.js',
	'www/**/*.js',
	'!www/script/lib/**/*'
];

let options = {
	// Specify style of output
	formatter: 'compact',  // Defaults to `stylish`

	// Only display warnings if a test is failing
	alwaysWarn: true,  // Defaults to `true`, always show warnings

	// Increase the timeout of the test if linting takes to long
	timeout: 10000,  // Defaults to the global mocha `timeout` option

	// Increase the time until a test is marked as slow
	slow: 1000,  // Defaults to the global mocha `slow` option

	// Consider linting warnings as errors and return failure
	strict: true,  // Defaults to `false`, only notify the warnings

	// Specify the mocha context in which to run tests
	contextName: 'eslint',  // Defaults to `eslint`, but can be any string
};

// Run the tests
lint(paths, options);
