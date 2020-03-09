# ServiceManager for Typescript

## Introduction

This TypeScript library provides a factory-driven dependency injection (DI) container, based on [Laminas' ServiceManager](https://docs.laminas.dev/laminas-servicemanager/).

- [Introduction](#introduction)
- [Quick Start](#quick-start)
- [Why Use ServiceManager?](#why-use-servicemanager)
  - [The Case For Dependency Injection](#the-case-for-dependency-injection)
  - [Is An Alternative Better For You?](#is-an-alternative-better-for-you)
  - [The Case For The Service Locator Pattern](#the-case-for-the-service-locator-pattern)
  - [Isn't Service Locator An Anti-Pattern?](#isnt-service-locator-an-anti-pattern)
  - [The (Further) Case For Factories](#the-further-case-for-factories)
  - [Type Integrity Baked In](#type-integrity-baked-in)
  - [Highly Customisable](#highly-customisable)
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

## Why Use ServiceManager?

### The Case For Dependency Injection

_Dependency injection_ is often (mistakenly) referred to as _inversion of control_ (IoC for short). It's not IoC, it's its own thing.

Libraries and modules inside apps use utility classes/functions, such as loggers. Without dependency injection, libraries and modules decide for themselves which utilities they are going to use.

That causes problems in applications, where you often need everything to use the same utilities. An application that ends up using half a dozen different loggers will be very hard to deploy and maintain over time, for example. An application making half a dozen different connections to the same database server will end up DDoSing your database when your app gets busy.

_Dependency injection_ solves this problem. The libraries and modules depend on shared interfaces, and your app passes in the actual utilities to use. These utilities normally come from a _dependency injection container_ (DI container for short), so that they get reused over and over rather than re-created.

The question isn't if _dependency injection_ is good practice. It is. The question is: what kind of dependency injection suits you, your team, and your code base?

### Is An Alternative Better For You?

There are other dependency injection libraries for TypeScript, and plenty of articles about how to write your own. The vast majority of these use `@decorators` to effectively emulate behaviour known as _auto-wiring_.

You should definitely check them out. They might suit your needs better.

### The Case For The Service Locator Pattern

_ServiceManager_ is an implementation of the [service locator pattern](https://en.wikipedia.org/wiki/Service_locator_pattern).

In brief, that means there's a central container that holds all the services. You create it once (when your app starts up), and then use it over and over until your app shuts down.

(You _can_ have multiple DI containers. There's nothing in _ServiceManager_ to prevent that. In practice, we've never come across a reason to have more than one in your production app.)

That means there's one place in your app to:

* standardise how each service is created
* find the list of available services
* get a service that you need

Having (for example) one place to go and get a Logger or a Database connection saves a lot of problems over the lifetime of an app. Any changes or maintenance needed? That only needs doing in the one place.

### Isn't Service Locator An Anti-Pattern?

You might have read [that the service locator is an anti-pattern, and should be avoided](https://blog.ploeh.dk/2010/02/03/ServiceLocatorisanAnti-Pattern/). We're going to address that in this part of the README.

Obviously, we don't agree :)

That article is 10 years old (at the time of writing this README), and we believe that it doesn't stand up to widespread practical experience in the years since. The PHP Community - one of the largest programming communities on Earth - has been successfully and safely using service locator-based DI containers for the last 7+ years.

The main flaw in the article is that all of its arguments and examples are based on the DI container being a `static` class that's invisibly consumed by services. Today, these `static` singletons are well-known to be terrible pieces of software design. Remove the `static` singleton from the examples, and the arguments largely fall away too.

(In 2010, the author may not have known that `static` singletons were terrible software design.)

Setting aside the examples, the article's underlying premise is that **it's bad software design to have silent dependencies**. We certainly agree with that. If _any_ piece of code has dependencies that you cannot see at compile-time, you have no way of knowing what dependencies the service relies on, until you run it and it falls over. That's a _robustness_ issue, and it may not get caught until the code is in production.

That is not a problem with the _service locator pattern_. It's a problem caused by breaking the principle of encapsulation.

Fortunately, it's an easy problem to avoid in practice:

* do not pass the DI container itself into any of your services,
* pass the dependencies into your service's constructor;
* use factories to decouple the service from the container,
* and don't use `static` singletons for your DI container in the first place

In your app, it's _your_ factory that grabs any dependencies from the container - not your service's constructor. Your service should never ever see the container. *Don't pass the container into your service, ever*, and you'll be fine.

Do this, and you'll find that the other argument against _service locator_ - that it's hard to test - also doesn't stand up to scrutiny.

* Your service doesn't know anything about the DI container, so there's no impact on testing there. Your service remains as easy (or as hard) to test as it has always been.
* Your factories do need a populated DI container, but that's the only place where coupling occurs.

What happens in practice is that the tests for your factory also serve as extra, executable documentation of what dependencies your service needs, because the test needs to populate the DI container. It makes the list of dependencies explicit, in a way that even the service's constructor cannot. New developers can look at the tests, and see exactly what dependencies each service has.

We've successfully - and safely - used factory-driven service locators on many projects, including a busy payment system for central government. We've successfully handed these projects over to other developers, who had no difficulty in continuing to use factory-driven service locators long after we'd left the project.

With _ServiceManager_, we're bringing this tried-and-proven approach to our TypeScript projects.

### The (Further) Case For Factories

_ServiceManager_ is based on a _factory-driven_ feature set from PHP's Laminas ServiceManager. It doesn't support `@decorators` - and probably never will.

So why this approach?

* The resulting code is much easier to trace and maintain. `@decorators` do save a lot of time when writing code for the first time, but it can be hard for future maintainers to trace through the code and work out exactly how it is working.
* The compiled JavaScript looks much more like the original TypeScript. That makes it easier to respond to runtime failures, and map the JavaScript error stack trace to your original code.
* It's your app that decides which factories are used to create each service. That puts you - the app author - in control, not the library. That's what _inversion of control_ is actually about.

In our experience, these benefits are worth the little bit of extra effort required to write factory-driven DI code.

### Type Integrity Baked In

A _dependency injection container_ (DI container for short) has to hold many different types of object. That's its job. That also means that you don't get the compile-time checks that make TypeScript worth using.

You end up either:

* using typecasts (such as `as XXX`) to tell the compiler to trust that you have the right object from the DI container, or
* using type guards to prove to the compiler that you have the object you asked the DI container for

Typecasts are dangerous as hell in TypeScript. **They transfer all the risk to when your code runs**. If there's a problem, you only find out about it when your code goes bang.

Type guards are safe, but **they transfer all the costs to when your code runs**. Every time you retrieve a service from the DI container, those guards have to be run. Those costs quickly add up, and slow down your app.

With _ServiceManager_, we've found a way to make it hold different types of object _and_ still have compile-time type information that you can trust. Provided you know in advance what services you want to register, you can rely on the TypeScript compiler to eliminate both the runtime risk and the runtime cost.

### Highly Customisable

At its heart, the _ServiceManager_ is an object that calls a function to retrieve your service object. _You_ decide which function it calls for each service.

And that means **you can customise it to behave however you need**.

We've shipped [a bunch of pre-built functions](#table-of-serviceprovider-builders) that cover the behaviours you'll probably want the most. They're based on the behaviours that we regularly use in the Laminas ServiceManager.

If you need something different, there's nothing stopping you from writing your own functions (called [`ServiceProvider` builders](#serviceprovider-builders)) as well, and mixing them in with our pre-built behaviours.

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
// or type guards (has a runtime cost) to ensure
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