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
import { OPTIONS_PREPARER_DEFAULT } from "./OptionsPreparer";
import { ServiceProducer } from "./ServiceProducer";
import { sharedInstance } from "./sharedInstance";

interface UnitTestServiceOptions {
    refCount: number;
}

interface UnitTestService {
    options: UnitTestServiceOptions;
}

describe("sharedInstance()", () => {
    it("builds a ServiceProvider", () => {
        const myFactory: ServiceProducer<UnitTestService, UnitTestServiceOptions> = (
            diContainer: AnyServiceManager,
            name: string,
            options: UnitTestServiceOptions,
        ): UnitTestService => {
            return { options };
        };

        const container = new ServiceManager({});
        const unit = sharedInstance(container, "test1", myFactory, { refCount: 0 });

        expect(unit).to.be.instanceOf(Function);
    });

    it("builds a ServiceProvider that always returns the same instance", () => {
        const myFactory = (diContainer: AnyServiceManager, name: string, options: UnitTestServiceOptions) => {
            return { options };
        };

        const container = new ServiceManager({});
        container.addProvider(
            "test1",
            sharedInstance(container, "test1", myFactory, { refCount: 0 }),
        );

        const instance1 = container.get("test1") as UnitTestService;
        const instance2 = container.get("test1") as UnitTestService;

        instance1.options.refCount = 2;
        expect(instance1).to.eql(instance2);
    });

    it("the returned ServiceProvider only calls the factory once", () => {
        let refCount = 0;
        const myFactory = (diContainer: AnyServiceManager, name: string, options: UnitTestServiceOptions) => {
            refCount++;
            return { options };
        };

        const container = new ServiceManager({});
        container.addProvider(
            "test1",
            sharedInstance(container, "test1", myFactory, { refCount: 2 }),
        );

        const instance1 = container.get("test1");
        const instance2 = container.get("test1");

        expect(refCount).to.equal(1);
        expect(instance1).to.eql(instance2);
    });

    it("the returned ServiceProvider applies the postInitActions", () => {
        const myFactory = (diContainer: AnyServiceManager, name: string, options: UnitTestServiceOptions) => {
            return { options };
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
            sharedInstance(
                container,
                "test1",
                myFactory,
                { refCount: 0 },
                OPTIONS_PREPARER_DEFAULT,
                myActions,
            ),
        );

        const instance1 = container.get("test1") as UnitTestService;
        const instance2 = container.get("test1") as UnitTestService;

        expect(instance1.options.refCount).to.equal(6);
        expect(instance1).to.eql(instance2);
    });
});