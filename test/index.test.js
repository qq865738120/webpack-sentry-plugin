import fs from 'fs'
import path from 'path'

import { cleanUpRelease, fetchRelease, fetchFiles } from './sentry-helpers'
import { createWebpackConfig, runWebpack, OUTPUT_PATH } from './webpack-helpers'

function ensureOutputPath() {
	if (!fs.existsSync(OUTPUT_PATH)) {
		fs.mkdirSync(OUTPUT_PATH)
	}
}

// Work around Jest not having expect.fail()
function expectNoFailure(msg) {
	return () => {
		throw new Error(msg)
	}
}

function expectReleaseContainsFile(filename) {
	return (files) => {
		const filenames = files.map(({ name }) => name)
		expect(filenames).toContain(filename)

		return Promise.resolve(files)
	}
}

function expectReleaseDoesNotContainFile(filename) {
	return (files) => {
		const filenames = files.map(({ name }) => name)
		expect(filenames).not.toContain(filename)

		return Promise.resolve(files)
	}
}

// Don't mock HTTP requests - testing the correctness of the integration
jest.unmock('request-promise')

beforeEach(ensureOutputPath)

describe('creating Sentry release', () => {
	afterAll(cleanUpRelease('string-release'))
	afterAll(cleanUpRelease('function-release'))

	it('with string version', () => {
		const release = 'string-release'

		return runWebpack(createWebpackConfig({ release }))
			.then(() => fetchRelease(release))
			.then(({ version }) => expect(version).toEqual(release))
			.catch(expectNoFailure('Release not found'))
	})

	it('with version from function', () => {
	  const release = 'function-release'

		return runWebpack(createWebpackConfig({
			release: () => release
		}))
		.then(() => fetchRelease(release))
		.then(({ version }) => expect(version).toEqual(release))
		.catch(expectNoFailure('Release not found'))
	})
})

describe('uploading files to Sentry release', () => {
	const release = 'test-release'

	afterEach(cleanUpRelease(release))

	it('uploads source and matching source map', () => {
		return runWebpack(createWebpackConfig({ release }))
			.then(() => fetchFiles(release))
			.then(expectReleaseContainsFile('index.bundle.js'))
			.then(expectReleaseContainsFile('index.bundle.js.map'))
	})

	it('filters files based on include', () => {
		return runWebpack(createWebpackConfig({
			release,
			include: /foo.bundle.js/
		}, {
			entry: {
				foo: path.resolve(__dirname, 'fixtures/foo.js'),
				bar: path.resolve(__dirname, 'fixtures/bar.js')
			}
		}))
		.then(() => fetchFiles(release))
		.then(expectReleaseContainsFile('foo.bundle.js'))
		.then(expectReleaseContainsFile('foo.bundle.js.map'))
		.then(expectReleaseDoesNotContainFile('bar.bundle.js'))
		.then(expectReleaseDoesNotContainFile('bar.bundle.js.map'))
	})

	it('filters files based on exclude', () => {
		return runWebpack(createWebpackConfig({
			release,
			exclude: /foo.bundle.js/
		}, {
			entry: {
				foo: path.resolve(__dirname, 'fixtures/foo.js'),
				bar: path.resolve(__dirname, 'fixtures/bar.js')
			}
		}))
		.then(() => fetchFiles(release))
		.then(expectReleaseDoesNotContainFile('foo.bundle.js'))
		.then(expectReleaseDoesNotContainFile('foo.bundle.js.map'))
	})
})
