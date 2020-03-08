//
// Copyright (c) 2020-present Ganbaro Digital Ltd
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions
// are met:
//
//   * Re-distributions of source code must retain the above copyright
//     notice, this list of conditions and the following disclaimer.
//
//   * Redistributions in binary form must reproduce the above copyright
//     notice, this list of conditions and the following disclaimer in
//     the documentation and/or other materials provided with the
//     distribution.
//
//   * Neither the names of the copyright holders nor the names of his
//     contributors may be used to endorse or promote products derived
//     from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
// FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
// COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
// INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
// BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
// CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
// LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
// ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
//
import { DependencyNotFoundError } from "../Errors";
import { ServiceProvider } from "../Providers";
import { ServicesList } from "./ServicesList";

/**
 * represents any possible ServiceManager
 *
 * use this in functions that take a DI container as a parameter
 */
export type AnyServiceManager = ServiceManager<any>;

/**
 * a DI container that supports both direct-access to services
 * (from within your app) and runtime get/set access
 * (from within external packages)
 *
 * you'll find it more convenient to extend this class, than to
 * just create an instance of it
 *
 * e.g. `class Injectables extends ServiceManager<MyServices> { ... }`
 */
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
    public constructor(services: L) {
        this.services = services;
    }

    /**
     * adds a service to the DI container
     *
     * You can also use this to replace an existing service.
     *
     * @param name
     * @param provider
     */
    public addProvider<T extends object>(name: string, provider: ServiceProvider<T>) {
        (this.services as ServicesList)[name] = provider;
    }

    /**
     * retrieve a service from the DI container
     *
     * @param name
     */
    public get(name: string): object {
        const provider = this.getProvider(name);
        return provider();
    }

    /**
     * retrieve an existing ServiceProvider from the DI container
     *
     * @param name
     */
    public getProvider(name: string): ServiceProvider<object> {
        // make sure we have a provider for the requested service
        //
        // NOTE that we're not proving that the provider returns
        // the expected type - just that it exists
        this.mustProvide(name);

        // all done
        return this.services[name];
    }

    /**
     * data guard. checks to see if we have a provider for the
     * requested service
     *
     * @param name
     *        the service you want to check for
     */
    public has(name: string): boolean {
        return (this.services[name] !== undefined);
    }

    /**
     * data guarantee. throws a DependencyNotFoundError if we do not
     * have a provider for the requested service
     *
     * @param name
     */
    public mustProvide(name: string) {
        // do we have the requested service?
        if (!this.has(name)) {
            throw new DependencyNotFoundError({
                logsOnly: {
                    serviceName: name,
                },
            });
        }
    }
}