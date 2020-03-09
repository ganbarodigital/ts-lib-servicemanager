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
import { AnyServiceManager } from "../ServiceManager";
import { OPTIONS_PREPARER_DEFAULT, OptionsPreparer } from "./OptionsPreparer";
import { ServiceAction } from "./ServiceAction";
import { ServiceProducer } from "./ServiceProducer";
import { ServiceProvider } from "./ServiceProvider";

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
 * @param optsProvider
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
    optsProvider: OptionsPreparer<O> = OPTIONS_PREPARER_DEFAULT,
    postInitActions: Array<ServiceAction<T>> = [],
): ServiceProvider<T> {
    return (): T => {
        // (possibly) clone the options
        //
        // it is VERY easy for the factory to forget about this, and
        // accidentally embed a shared copy of the options within
        // each new instance
        const instanceOptions = optsProvider(options);

        // build the service
        const service = factory(container, requestedName, instanceOptions);

        // run the actions we've been given
        postInitActions.forEach((action) => {
            action(service);
        });

        // all done
        return service;
    };
}