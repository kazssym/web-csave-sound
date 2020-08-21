// app.js
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
 * ES module for the application.
 *
 * @module app.js
 */

/**
 * Audio context.
 */
let audioContext = new AudioContext();

audioContext.audioWorklet.addModule("./resources/worklet.js");

async function doPlay()
{
    console.debug("doPlay!");

    if (audioContext.state == "suspended") {
        await audioContext.resume();
    }

    let textArea = document.getElementById("text-data");
    let data = [];
    if (textArea != null) {
        let encoder = new TextEncoder();
        data = encoder.encode(textArea.value);
    }

    let csaveNode = new AudioWorkletNode(audioContext, "csave-processor", {
        processorOptions: {
            bitRate: 1200,
            data: data,
        },
    });
    csaveNode.connect(audioContext.destination);
}

function bindCommands()
{
    for (let i of document.getElementsByClassName("app-command-play")) {
        i.addEventListener("click", doPlay);
        if (i.disabled) {
            i.disabled = false;
        }
    }
}

async function registerServiceWorker(name)
{
    let registration = await navigator.serviceWorker.register(name);
    console.debug("registered service worker: %o", registration);
}


registerServiceWorker("./service.js");
bindCommands();
