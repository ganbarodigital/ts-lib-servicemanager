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

import { DependencyNotFoundError } from "../Errors";
import { ServiceProvider } from "../Providers";
import { ServiceManager } from "./ServiceManager";
import { ServicesList } from "./ServicesList";

interface MyServicesList extends ServicesList {
    dummy: ServiceProvider<object>;
}

const myServices = {
    dummy: () => ({ message: "hello, world" }),
};

class UnitTestServiceManager extends ServiceManager<MyServicesList> { }

describe("ServiceManager", () => {
    describe(".constructor()", () => {
        it("creates a DI container with the given services", () => {
            const expectedValue = myServices.dummy();
            const unit = new ServiceManager(myServices);

            // this will not compile if the DI code isn't working
            const actualValue = unit.services.dummy();

            expect(actualValue).to.eql(expectedValue);
        });

        it("can be used from a child class", () => {
            const expectedValue = myServices.dummy();
            const unit = new UnitTestServiceManager(myServices);

            // this will not compile if the DI code isn't working
            const actualValue = unit.services.dummy();

            expect(actualValue).to.eql(expectedValue);
        });
    });

    describe(".addProvider()", () => {
        it("registers a new service", () => {
            const expectedMessage = "dynamically-added service";
            const expectedValue = {message: expectedMessage};

            // we need to clone the services list, to prevent
            // our test fixture from being overwritten
            const services: ServicesList = {};
            Object.assign(services, myServices);

            const unit = new ServiceManager(services);
            unit.addProvider("dummy2", () => expectedValue);

            const actualValue = unit.get("dummy2");

            expect(actualValue).to.eql(expectedValue);
        });

        it("can replace an existing service", () => {
            const expectedMessage = "dynamically-added service";
            const expectedValue = {message: expectedMessage};

            // we need to clone the services list, to prevent
            // our test fixture from being overwritten
            const services: ServicesList = {};
            Object.assign(services, myServices);

            // inject the clone into our DI container
            const unit = new ServiceManager(services);
            expect(unit.services.dummy()).to.eql(myServices.dummy());

            unit.addProvider("dummy", () => expectedValue);

            const actualValue = unit.get("dummy");

            expect(actualValue).to.eql(expectedValue);
            expect(actualValue).to.not.equal(myServices.dummy());
        });
    });

    describe(".get()", () => {
        it("returns the result of calling the stored ServiceProvider", () => {
            const expectedValue = myServices.dummy();
            const unit = new ServiceManager(myServices);

            const actualValue = unit.get("dummy");

            expect(actualValue).to.eql(expectedValue);
        });

        it("throws a DependencyNotFoundError if the service does not exist", () => {
            const unit = new ServiceManager(myServices);

            expect(() => unit.get("dummy2")).to.throw(DependencyNotFoundError);
        });
    });

    describe(".getProvider()", () => {
        it("returns the stored ServiceProvider", () => {
            const expectedValue = myServices.dummy;
            const unit = new ServiceManager(myServices);

            const actualValue = unit.getProvider("dummy");

            expect(actualValue).to.equal(expectedValue);
        });

        it("throws a DependencyNotFoundError if the service does not exist", () => {
            const unit = new ServiceManager(myServices);

            expect(() => unit.get("dummy2")).to.throw(DependencyNotFoundError);
        });
    });

    describe(".has()", () => {
        it("returns `true` if there's a provider for the given service", () => {
            const unit = new ServiceManager(myServices);

            const actualValue = unit.has("dummy");

            expect(actualValue).to.equal(true);
        });

        it("returns `false` if there isn't a provider for the given service", () => {
            const unit = new ServiceManager(myServices);

            const actualValue = unit.has("dummy2");

            expect(actualValue).to.equal(false);
        });
    });

    describe(".mustProvide()", () => {
        it("returns if there is a provider for the given service", () => {
            const unit = new ServiceManager(myServices);

            expect(() => { unit.mustProvide("dummy"); }).to.not.throw();
        });

        it("throws a DependencyNotFoundError if there isn't a provider for the given service", () => {
            const unit = new ServiceManager(myServices);

            expect(() => unit.get("dummy2")).to.throw(DependencyNotFoundError);
        });
    });
});