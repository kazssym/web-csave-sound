// decorate.js
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

// This file is a module script and shall be in strict mode by default.

/**
 * ES module to decorate a web page on the client side.
 *
 * @module decorate.js
 */

const PURE_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/pure/2.0.3/pure-min.css";

const MATERIAL_ICONS_FONT_URL =
    "https://fonts.googleapis.com/icon?family=Material+Icons&display=block";

/**
 * Stylesheets to be added to the document.
 */
const STYLESHEETS = [
    {href: PURE_URL, crossOrigin: "anonymous"},
    {href: MATERIAL_ICONS_FONT_URL, crossOrigin: "anonymous"},
    {href: "resources/site.css"},
    {href: "resources/site-theme-default.css", title: "Default Theme"},
];

/**
 * Function type to populate a DOM element.
 * The type of the return value is unspecified.
 *
 * @callback ElementPopulator
 * @param {Element} element a DOM element to populate
 */

/**
 * Creates a new DOM element.
 *
 * @param {string} tagName tag name
 * @param {*} [properties] properties assigned to the new element
 * @param {ElementPopulator} [populate] function to populate the new element
 * @return {Element} a new DOM element
 */
function newElement(tagName, properties, populate)
{
    let element = document.createElement(tagName);
    if (properties != null) {
        Object.assign(element, properties);
    }
    if (populate != null) {
        populate(element);
    }
    return element;
}

/**
 * Add linked stylesheets to the document.
 *
 * @param  {...*} stylesheets array of properties for the stylesheet links
 */
function addStylesheets(...stylesheets)
{
    let head = document.head;
    for (let i of stylesheets) {
        let properties = Object.assign({rel: "stylesheet"}, i);
        head.appendChild(newElement("link", properties));
    }
}

/**
 * Waits for the DOM content of the document to be loaded.
 *
 * @return {Promise<Event>} a Promise object for a `DOMContentLoaded` event
 */
function waitForDocument()
{
    return new Promise((resolve) => {
        if (document.readyState != "loading") {
            // The 'DOMContentLoaded' event has already been fired.
            resolve();
        }
        else {
            document.addEventListener("DOMContentLoaded", resolve);
        }
    });
}


// This should be safe to do here.
addStylesheets(...STYLESHEETS);

waitForDocument()
    .then((/* event */) => {
        // Nothing to do yet.
    });
