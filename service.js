// service.js
// Copyright (C) 2020 Kaz Nishimura
//
// This program is free software: you can redistribute it and/or modify it
// under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or (at your
// option) any later version.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License
// for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Service worker module.
 *
 * @module service.js
 */

"use strict";

const CACHE_NAME = "1.0";

self.addEventListener("install",
    (event) => {
        let prepareCache = async () => {
            try {
                let cache = await caches.open(CACHE_NAME);
                return await cache.addAll([
                    "",
                    "index.html",
                    "service.js",
                    "resources/decorate.js",
                    "resources/app.js",
                    "resources/site.css",
                    "resources/site-theme-default.css",
                ]);
            }
            catch (error) {
                // Nothing to do here.
            }
        };
        event.waitUntil(prepareCache());
    }
);

self.addEventListener("fetch",
    (event) => {
        if (event.request.method == "GET") {
            let getResponse = async (request) => {
                let response = await caches.match(request);
                if (response != null) {
                    return response;
                }
                response = await fetch(request);

                let cache = await caches.open(CACHE_NAME);
                await cache.put(request, response);
                return await cache.match(request);
            };
            event.respondWith(getResponse(event.request));
        }
    }
);
