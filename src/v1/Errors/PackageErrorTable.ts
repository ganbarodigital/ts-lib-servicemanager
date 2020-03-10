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
import {
    ErrorTable,
    ErrorTableTemplateWithNoExtraData,
    ExtraDataTemplate,
    NoExtraDataTemplate,
} from "@ganbarodigital/ts-lib-error-reporting/lib/v1";
import { httpStatusCodeFrom } from "@ganbarodigital/ts-lib-http-types/lib/v1";
import { packageNameFrom } from "@ganbarodigital/ts-lib-packagename/lib/v1";

import { DependencyNotFoundTemplate } from "./DependencyNotFound";

const PACKAGE_NAME = packageNameFrom("@ganbarodigital/ts-lib-servicemanager");

type PackageErrorTableIndex<T extends ErrorTable> = ErrorTableTemplateWithNoExtraData<
    T, string, ExtraDataTemplate | NoExtraDataTemplate
>;

export class PackageErrorTable implements ErrorTable {
    // tslint:disable-next-line: max-line-length
    [key: string]: PackageErrorTableIndex<PackageErrorTable>;

    public "dependency-not-found": DependencyNotFoundTemplate = {
        packageName: PACKAGE_NAME,
        errorName: "dependency-not-found",
        detail: "requested service not found in the DI container",
        status: httpStatusCodeFrom(500),
        extra: {
            logsOnly: {
                serviceName: "put the name of the missing service here",
            },
        },
    };
}

export const ERROR_TABLE = new PackageErrorTable();