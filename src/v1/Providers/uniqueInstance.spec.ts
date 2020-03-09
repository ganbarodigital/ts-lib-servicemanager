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
import { expect } from "chai";
import { describe } from "mocha";

import { AnyServiceManager, ServiceManager } from "../ServiceManager";
import { uniqueInstance } from "./uniqueInstance";

interface UnitTestServiceOptions {
    refCount: number;
}

interface UnitTestService {
    options: UnitTestServiceOptions;
}

describe("uniqueInstance()", () => {
    it("builds a ServiceProvider", () => {
        const myFactory = (diContainer: AnyServiceManager, name: string, options: object) => {
            return { options };
        };

        const container = new ServiceManager({});
        const unit = uniqueInstance(container, "test1", myFactory, {});

        expect(unit).to.be.instanceOf(Function);
    });

    it("builds a ServiceProvider that always calls your factory", () => {
        let factoryCallCount = 0;
        const myFactory = (diContainer: AnyServiceManager, name: string, options: UnitTestServiceOptions) => {
            factoryCallCount++;

            // we have to create a COPY of the options
            // VERY easy to forget to do this!
            return {
                options: {
                    refCount: options.refCount,
                },
            };
        };
        const myActions = [
            (service: UnitTestService) => {
                service.options.refCount++;
            },
            (service: UnitTestService) => {
                service.options.refCount += 5;
            },
        ];

        const container = new ServiceManager({});
        container.addProvider(
            "test1",
            uniqueInstance(container, "test1", myFactory, { refCount: 0 }, myActions),
        );

        // this is our first action that should trigger the factory
        expect(factoryCallCount).to.equal(0);
        const instance1 = container.get("test1") as UnitTestService;
        expect(factoryCallCount).to.equal(1);
        expect(instance1.options.refCount).to.equal(6);

        // grabbing a second instance should not change our
        // control at all
        const instance2 = container.get("test1") as UnitTestService;
        expect(factoryCallCount).to.equal(2);
        expect(instance1.options.refCount).to.equal(6);
        expect(instance2.options.refCount).to.equal(6);
    });

    it("the returned ServiceProvider applies the postInitActions", () => {
        let actionsCalledCount = 0;

        const myFactory = (diContainer: AnyServiceManager, name: string, options: UnitTestServiceOptions) => {
            // we have to create a COPY of the options
            // VERY easy to forget to do this!
            return {
                options: {
                    refCount: options.refCount,
                },
            };
        };
        const myActions = [
            (service: UnitTestService) => {
                actionsCalledCount++;
                service.options.refCount++;
            },
            (service: UnitTestService) => {
                actionsCalledCount++;
                service.options.refCount += 5;
            },
        ];

        const container = new ServiceManager({});
        container.addProvider(
            "test1",
            uniqueInstance(container, "test1", myFactory, { refCount: 0 }, myActions),
        );

        // prove that the returned service has been modified by the
        // postInitActions
        const instance1 = container.get("test1") as UnitTestService;
        expect(instance1.options.refCount).to.equal(6);
        const instance2 = container.get("test1") as UnitTestService;
        expect(instance2.options.refCount).to.equal(6);

        // prove that the postInitActions have been called the
        // expected number of times
        expect(actionsCalledCount).to.equal(4);
    });
});