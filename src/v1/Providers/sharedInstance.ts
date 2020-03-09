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
import { AnyServiceManager, ServicesList } from "../ServiceManager";
import { existingInstance } from "./existingInstance";
import { ServiceAction } from "./ServiceAction";
import { ServiceProducer } from "./ServiceProducer";
import { ServiceProvider } from "./ServiceProvider";

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
 * @param postInitActions
 *        a list of functions to run after the factory has been called
 */
export function sharedInstance<T extends object, O extends object = object>(
    container: AnyServiceManager,
    serviceName: string,
    factory: ServiceProducer<T, O>,
    options: O,
    postInitActions: Array<ServiceAction<T>> = [],
): ServiceProvider<T> {
    return (): T => {
        // build the service
        const service = factory(container, serviceName, options);

        // run the actions we've been given
        postInitActions.forEach((action) => {
            action(service);
        });

        // store it in the container
        //
        // this does have the side-effect of replacing the factory
        // for the rest of the lifetime of the container
        (container.services as ServicesList)[serviceName] = existingInstance(service);

        // all done
        return service;
    };
}