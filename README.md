# ServiceManager for Typescript

## Introduction

This TypeScript library provides a factory-driven dependency injection (DI) container, based on [Laminas' ServiceManager](https://docs.laminas.dev/laminas-servicemanager/).

- [Introduction](#introduction)
- [Quick Start](#quick-start)
- [V1 API](#v1-api)
  - [ServiceManager](#servicemanager)
  - [AnyServiceManager](#anyservicemanager)
  - [ServiceProvider](#serviceprovider)
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
import { DiFactory } from "@ganbarodigital/ts-lib-servicemanager/lib/v1"
```

__VS Code users:__ once you've added a single import anywhere in your project, you'll then be able to auto-import anything else that this library exports.

## V1 API

### ServiceManager

```typescript
export class ServiceManager<L extends ServicesList> {
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

### ServiceProvider

```typescript
/**
 * a ServiceProvider returns an instance of the requested service
 */
export type ServiceProvider<T extends object> = () => T;
```

`ServiceProvider` is a function type. `ServiceProvider`s control the behaviour of the DI container, whenever you retrieve a service from the DI container.

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