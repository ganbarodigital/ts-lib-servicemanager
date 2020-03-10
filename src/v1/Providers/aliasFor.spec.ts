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

import { ServiceManager } from "../ServiceManager";
import { aliasFor } from "./aliasFor";
import { existingInstance } from "./existingInstance";

interface UnitTestService {
    ref: number;
}

const myService1 = {
    ref: 1,
};

const myService2 = {
    ref: 999,
};

describe("aliasFor()", () => {
    it("builds a ServiceProvider", () => {
        const container = new ServiceManager({});
        container.addProvider("test1", existingInstance(myService1));
        container.addProvider("test2", aliasFor(container, "test1"));

        const actualValue = container.getProvider("test2");
        expect(actualValue).to.be.instanceOf(Function);
    });

    it("always calls the container to get the right service", () => {
        const container = new ServiceManager({});
        container.addProvider("test1", existingInstance(myService1));
        container.addProvider("test2", aliasFor(container, "test1"));

        // prove that aliasFor() will return the same instance
        // that container.get("test1") returns
        const instance1 = container.get("test1") as UnitTestService;
        const instance2 = container.get("test2") as UnitTestService;

        instance1.ref = 200;
        expect(instance2.ref).to.eql(instance1.ref);

        // prove that aliasFor() isn't caching the service internally
        // in any way
        //
        // we do this by changing the service provider for "test1"
        container.addProvider("test1", existingInstance(myService2));

        const instance3 = container.get("test2") as UnitTestService;
        expect(instance3.ref).to.not.eql(instance1.ref);
    });
});