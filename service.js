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

const CACHE_NAME = "1.0.0-20200820.7";

self.addEventListener("install",
    (event) => {
        let prepareCache = async () => {
            try {
                let cache = await caches.open(CACHE_NAME);
                return await cache.addAll([
                    "",
                    "index.html",
                    "app.webmanifest",
                    "service.js",
                    "resources/decorate.js",
                    "resources/app.js",
                    "resources/worklet.js",
                    "resources/site.css",
                    "resources/site-theme-default.css",
                    "resources/linuxfront-icon-01-256.png",
                ]);
            }
            catch (error) {
                console.warn("caught an error: %o", error);
            }
        };
        event.waitUntil(prepareCache());
    }
);

self.addEventListener("activate",
    (event) => {
        let cleanCache = async () => {
            let cacheNames = await caches.keys();
            cacheNames.forEach((name) => {
                if (name != CACHE_NAME) {
                    caches.delete(name);
                }
            });
        };
        event.waitUntil(cleanCache());
    }
);

self.addEventListener("fetch",
    (event) => {
        if (event.request.method == "GET") {
            let getResponse = async (request) => {
                let cache = await caches.open(CACHE_NAME);
                if (request.cache != "reload") {
                    let responseCached = await cache.match(request);
                    if (responseCached != null) {
                        return responseCached;
                    }
                }

                let response = await fetch(request);
                if (response.type != "error") {
                    await cache.put(request, response.clone());
                }
                return response;
            };
            event.respondWith(getResponse(event.request));
        }
    }
);
