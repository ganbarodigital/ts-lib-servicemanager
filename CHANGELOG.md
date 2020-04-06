# CHANGELOG

## Introduction

This CHANGELOG tells you:

* when a release was made
* what is in each release

It also tells you what changes have been completed, and will be included in the next tagged release.

For each release, changes are grouped under these headings:

* _Backwards-Compatibility Breaks_: a list of any backwards-compatibility breaks
* _New_: a list of new features. If the feature came from a contributor via a PR, make sure you link to the PR and give them a mention here.
* _Fixes_: a list of bugs that have been fixed. If there's an issue for the bug, make sure you link to the GitHub issue here.
* _Dependencies_: a list of dependencies that have been added / updated / removed.
* _Tools_: a list of bundled tools that have been added / updated / removed.

## develop branch

The following changes have been completed, and will be included in the next tagged release.

## v0.1.2

Released Monday, 6th April 2020.

### Dependencies

* Updated to latest package releases
* Moved TypeScript et al into the list of dev dependencies

## v0.1.1

Released Tuesday, 10th March 2020.

### Fixes

* Added exports to the top-level `index.ts` file.

## v0.1.0

Released Tuesday, 10th March 2020.

### New

* Added `DependencyNotFoundError` error class
* Added `OptionsPreparer` function type
* Added `OPTIONS_PREPARER_DEFAULT` function
* Added `OPTIONS_PREPARER_NO_CLONE` function
* Added `ServiceAction` function type
* Added `ServiceProducer` function type
* Added `ServiceProvider` function type
* Added `ServiceManager` class
* Added `ServicesList` interface
* Added `AnyServiceManager` type alias
* Added `aliasFor()` ServiceProvider builder
* Added `existingService()` ServiceProvider builder
* Added `sharedInstance()` ServiceProvider builder
* Added `uniqueInstance()` ServiceProvider builder

### Dependencies

* Added `rfdc`
