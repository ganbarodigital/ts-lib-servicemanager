# ServiceManager for Typescript

## Introduction

This TypeScript library provides a factory-driven dependency injection (DI) container, based on [Laminas' ServiceManager](https://docs.laminas.dev/laminas-servicemanager/).

- [Introduction](#introduction)
- [Quick Start](#quick-start)
- [Core Types](#core-types)
  - [ServiceManager](#servicemanager)
  - [AnyServiceManager](#anyservicemanager)
  - [ServiceAction](#serviceaction)
  - [ServiceProducer](#serviceproducer)
  - [ServiceProvider](#serviceprovider)
  - [OptionsPreparer](#optionspreparer)
  - [OPTIONS_PREPARER_DEFAULT](#options_preparer_default)
  - [OPTIONS_PREPARPER_NO_CLONE](#options_preparper_no_clone)
- [ServiceProvider Builders](#serviceprovider-builders)
  - [Table Of ServiceProvider Builders](#table-of-serviceprovider-builders)
  - [aliasFor()](#aliasfor)
  - [existingInstance()](#existinginstance)
  - [sharedInstance()](#sharedinstance)
  - [uniqueInstance()](#uniqueinstance)
- [Errors](#errors)
  - [DependencyNotFoundError](#dependencynotfounderror)
- [NPM Scripts](#npm-scripts)
  - [npm run clean](#npm-run-clean)
  - [npm run build](#npm-run-build)
  - [npm run test](#npm-run-test)
  - [npm run cover](#npm-run-cover)

## Quick Start

```
# run this from your Terminal
npm install @ganbarodigital/ts-lib-servicemanager
```

```typescript
// add this import to your Typescript code
import { ServiceManager } from "@ganbarodigital/ts-lib-servicemanager/lib/v1"
```

__VS Code users:__ once you've added a single import anywhere in your project, you'll then be able to auto-import anything else that this library exports.

## Core Types

### ServiceManager

```typescript
export class ServiceManager<L extends ServicesList = ServicesList> {
    /**
     * holds all of the services stored in the DI container
     */
    public readonly services: L;

    /**
     * creates a new DI container
     *
     * @param services
     *        a list of services (and their factories) that you guarantee
     *        will be available
     */
    public constructor(services: L);

    /**
     * adds a service to the DI container
     *
     * You can also use this to replace an existing service.
     *
     * @param name
     * @param provider
     */
    public addProvider<T>(name: string, provider: ServiceProvider<T>);

    /**
     * retrieve a service from the DI container
     *
     * @param name
     */
    public get(name: string): object;

    /**
     * retrieve an existing ServiceProvider from the DI container
     *
     * @param name
     */
    public getProvider(name: string): ServiceProvider<object>;

    /**
     * data guard. checks to see if we have a provider for the
     * requested service
     *
     * @param name
     *        the service you want to check for
     */
    public has(name: string): boolean;

    /**
     * data guarantee. throws a DependencyNotFoundError if we do not
     * have a provider for the requested service
     *
     * @param name
     */
    public mustProvide(name: string);
```

`ServiceManager` is a _dependency-injection container_ (DI container for short).

To use it, define your own child class, and inject the services you know will be present:

```typescript

import {
    ServiceManager,
    ServiceProvider,
    ServicesList,
    sharedInstance
} from "@ganbarodigital/ts-lib-servicemanager/lib/v1";

// we need to define a list of services that will be
// exported as properties of the DI container
//
// everything in this list will have the maximum amount
// of type-safety support from the TypeScript compiler
interface AppServicesList extends ServicesList {
    logger: ServiceProvider<MyLogger>;
}

// for convenience, we'll subclass the ServiceManager
//
// this gives us a type that we can use in function parameter lists
//
// there's no need to add anything to the class definition at all
class AppServiceManager extends ServiceManager<AppServicesList> {
}

// this creates our DI container, and injects the list of services
// that are known
//
// `sharedInstance` is a `ServiceProvider`
//
// `ServiceProvider`s allow you to control what happens when the service
// is retrieved from the DI container
const container = new AppServiceManager({
    logger: sharedInstance(container, "logger", myLoggerFactory, {});
});

// you can now do this
//
// this is what you should do in your app, which is going to know
// the type of your container and its services
const logger = container.services.logger();

// or you can do this,
//
// but you have to use a typecast (not recommended)
// or type guards (incurns runtime penalty) to ensure
// that `logger` has the expected type
//
// this is what you will have to do in importable packages,
// which are not going to know the type of the container or
// its services
const logger = container.get("logger") as MyLogger;
```

### AnyServiceManager

```typescript
/**
 * represents any possible ServiceManager
 *
 * use this in functions that take a DI container as a parameter
 */
export type AnyServiceManager = ServiceManager<any>;
```

### ServiceAction

```typescript
/**
 * the prototype of any functional options
 */
export type ServiceAction<T extends object> = (service: T) => void;
```

`ServiceAction` is a function type. `ServiceAction`s are functions that modify the service after it has been created.

You can pass a list of `ServiceAction`s to some `ServiceProvider`s.

### ServiceProducer

```typescript
import { AnyServiceManager } from "../ServiceManager";

/**
 * prototype for your factory functions
 */
export type ServiceProducer<T extends object, O extends object = object>
  = (container: AnyServiceManager, requestedName: string, options: O) => T;
```

`ServiceProducer` is a function type. Your factory functions (the functions that create new services) must match this type.

### ServiceProvider

```typescript
/**
 * a ServiceProvider returns an instance of the requested service
 */
export type ServiceProvider<T extends object> = () => T;
```

`ServiceProvider` is a function type. `ServiceProvider`s control the behaviour of the DI container, whenever you retrieve a service from the DI container.

### OptionsPreparer

```typescript
/**
 * an OptionsPreparer returns a (possibly modified) instance of
 * the object you call it with
 *
 * putting this into function form allows us to swap out the behaviour
 * of how we prepare options that are passed to ServiceProducers
 */
export type OptionsPreparer<T extends object> = (options: T) => T;
```

`OptionsPreparer` is a function type. `OptionPreparer`s are used by `ServiceProvider` functions to make any necessary changes to the options before they are passed into your factory.

We currently ship two functions that do this job:

Function                  | Purpose
--------------------------|--------------------
[OPTIONS_PREPARER_DEFAULT](#options_preparer_default)  | Create deep clone of the options object
[OPTIONS_PREPARER_NO_CLONE](#options_preparper_no_clone) | Returns the options object without modification

We added the `OptionsPreparer` feature because it's really easy to accidentally embed a shared copy of the options in your service. That's probably not the behaviour you want, especially for the `uniqueInstance()` `ServiceProvider` builder.

### OPTIONS_PREPARER_DEFAULT

```typescript
/**
 * our default OptionsPreparer
 *
 * it returns a DEEP CLONE of the provided object
 */
export function OPTIONS_PREPARER_DEFAULT<T extends object>(options: T): T;
```

### OPTIONS_PREPARPER_NO_CLONE

```typescript
/**
 * an alternative OptionsPreparer
 *
 * it returns the same object instance that you call it with
 * (ie it DOES NOT create a clone of any kind)
 */
export function OPTIONS_PREPARER_NO_CLONE<T extends object>(options: T): T;
```

## ServiceProvider Builders

_`ServiceProvider` builders_ are functions that create `ServiceProvider` functions for you.

We've added them to cover common behaviours.

### Table Of ServiceProvider Builders

function             | Description | Supports ServiceActions
---------------------|-------------|-------------------------
`aliasFor()`         | create an alias for an existing service | NO
`existingInstance()` | always returns the same instance of a given service | NO
`sharedInstance()`   | builds a service using your factory, then returns the same instance of the service every time | YES
`uniqueInstance()` | calls your factory to get a new copy of the service every time | YES

### aliasFor()

```typescript
/**
 * ServiceProvider builder - create an alias for an existing service
 *
 * The returned function will always call your container to get the
 * requested service.
 *
 * @param container
 *        your DI container
 * @param name
 *        the original name for the service
 */
export function aliasFor(container: AnyServiceManager, name: string): ServiceProvider<object>;
```

`aliasFor()` is a `ServiceProvider` builder. You give it your container, and the name of an existing service, and the returned `ServiceProvider` will always call `container.get(name)` to return the service.

It allows you to give services multiple names. For example:

```typescript
const container = new ServiceManager({
    MyLogger: sharedInstance(...),
});
container.addProvider("logger", aliasFor(container, "MyLogger"));

// you can now do this, and it will be the same
// as calling `container.get("MyLogger")`
//
// `logger` will have the type `object`
const logger: container.get("logger");
```

Unfortunately, it currently isn't possible to get the return type information back to your code. You'll need to use type guards (recommended, but with a runtime cost) or typecasts (not recommended, as they override compile-time checks) to work with the resulting service.

### existingInstance()

```typescript
/**
 * ServiceProvider builder.
 *
 * The returned function will always return the given `service`.
 *
 * Use this to ensure that your DI container always returns the same instance
 * of a service.
 *
 * @param service
 *        the service that should always be returned
 */
export function existingInstance<T extends object>(service: T): ServiceProvider<T>;
```

`existingInstance()` is a `ServiceProvider` builder. You give it an instance of a service, and the returned `ServiceProvider` will always return that instance when called.

It's used internally by the [`sharedInstance()`](#sharedinstance) `ServiceProvider` builder. `sharedInstance()` creates the new service, then caches that service in your DI container by replacing itself with the `existingInstance()` function instead.

It's part of the public API. You're welcome to use it in your own code.

### sharedInstance()

```typescript
/**
 * returns a ServiceProvider
 *
 * the returned function calls the provided `factory` to create the new
 * service, and then makes sure that the same instance of the service is
 * returned in future
 *
 * internally, it does this by replacing itself in the DI container with
 * another ServiceProvider
 *
 * this guarantees that your `factory` is only called once, and it is only
 * called the first time that someone tries to get this service from
 * the DI container
 *
 * @param container
 *        your DI container
 * @param serviceName
 *        the name that the service will be registered under in
 *        the DI container
 * @param factory
 *        the function that will build the service
 * @param options
 *        a list of options to pass into the factory
 * @param optsPreparer
 *        a function to help prefer the options before they are passed
 *        into the factory
 *        the default function will create a DEEP CLONE of the options
 * @param postInitActions
 *        a list of functions to run after the factory has been called
 */
export function sharedInstance<T extends object, O extends object = object>(
    container: AnyServiceManager,
    serviceName: string,
    factory: ServiceProducer<T, O>,
    options: O,
    optsPreparer: OptionsPreparer<O> = OPTIONS_PREPARER_DEFAULT,
    postInitActions: Array<ServiceAction<T>> = [],
): ServiceProvider<T>;
```

`sharedInstance()` is a `ServiceProvider` builder. It uses the provided factory to build the service. No matter how many times you get the service from your DI container, it only calls the factory once.

This is the classic behaviour of most DI containers.

```typescript
// create an empty DI container
const container = new ServiceContainer({});

// register a "logger" service with the DI container
container.addProvider("logger", sharedInstance(container, "logger", myLoggerFactory, {}));

// at this point, `myLoggerFactory()` has NOT been called

const logger = container.get("logger");

// at this point, `myLoggerFactory()` HAS been called
// it won't get called again, even if you do:
const logger2 = container.get("logger");
```

By default, `sharedInstance()` passes a _clone_ of the `options` to your factory. This is so that you don't accidentally embed shared objects in your service. You can change this behaviour by passing `OPTIONS_PREPARER_NO_CLONE` in as the `optsPreparer` parameter.

### uniqueInstance()

```typescript
/**
 * returns a ServiceProvider
 *
 * the returned function calls the provided `factory` to create the new
 * service each and every time
 *
 * use this for when every caller should get a different instance of
 * the service
 *
 * @param container
 *        your DI container
 * @param serviceName
 *        the name that the service will be registered under in
 *        the DI container
 * @param factory
 *        the function that will build the service
 * @param options
 *        a list of options to pass into the factory
 * @param optsPreparer
 *        a function to help prefer the options before they are passed
 *        into the factory
 *        the default function will create a DEEP CLONE of the options
 * @param postInitActions
 *        a list of functions to run after the factory has been called
 */
export function uniqueInstance<T extends object, O extends object>(
    container: AnyServiceManager,
    requestedName: string,
    factory: ServiceProducer<T, O>,
    options: O,
    optsPreparer: OptionsPreparer<O> = OPTIONS_PREPARER_DEFAULT,
    postInitActions: Array<ServiceAction<T>> = [],
): ServiceProvider<T>;
```

`uniqueInstance()` is a `ServiceProvider` builder. It uses the provided factory to build the service, everytime someone gets the service from your DI container.

```typescript
// create an empty DI container
const container = new ServiceContainer({});

// register a "logger" service with the DI container
container.addProvider("logger", uniqueInstance(container, "logger", myLoggerFactory, {}));

// at this point, `myLoggerFactory()` has NOT been called

const logger = container.get("logger");

// at this point, `myLoggerFactory()` HAS been called

const logger2 = container.get("logger");

// and now `myLoggerFactory()` HAS been called again
```

By default, `uniqueInstance()` passes a _clone_ of the `options` to your factory. This is so that you don't accidentally embed shared objects in your service. You can change this behaviour by passing `OPTIONS_PREPARER_NO_CLONE` in as the `optsPreparer` parameter.

## Errors

### DependencyNotFoundError

```typescript
export interface DependencyNotFoundExtraData {
    logsOnly: {
        serviceName: string;
    };
}

export class DependencyNotFoundError extends AppError {
    public constructor(params: DependencyNotFoundExtraData & AppErrorParams);
}
```

`DependencyNotFoundError` is a throwable / catchable Javascript `Error`.

## NPM Scripts

### npm run clean

Use `npm run clean` to delete all of the compiled code.

### npm run build

Use `npm run build` to compile the Typescript into plain Javascript. The compiled code is placed into the `lib/` folder.

`npm run build` does not compile the unit test code.

### npm run test

Use `npm run test` to compile and run the unit tests. The compiled code is placed into the `lib/` folder.

### npm run cover

Use `npm run cover` to compile the unit tests, run them, and see code coverage metrics.

Metrics are written to the terminal, and are also published as HTML into the `coverage/` folder.