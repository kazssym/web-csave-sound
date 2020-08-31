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

import "https://unpkg.com/audioworklet-polyfill/dist/audioworklet-polyfill.js";

const FAKE_HEADER = Uint8Array.of(
    0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3,
    0x20, 0x20, 0x20, 0x20, 0x20, 0x20);

function createCsaveNode(context)
{
    let form = document.forms["demo"];
    let symbolRate = 0;
    if (form != null) {
        for (let radio of form["symbol-rate"]) {
            if (radio.checked) {
                symbolRate = parseFloat(radio.value);
                console.debug("symbol rate checked: %d", symbolRate);
            }
        }
    }
    if (symbolRate == 0) {
        symbolRate = 1200;
    }

    let textArea = document.getElementById("text-data");
    let data = [];
    if (textArea != null) {
        let encoder = new TextEncoder();
        data = encoder.encode(textArea.value);
    }

    let csaveNode = new AudioWorkletNode(context, "csave-processor", {
        processorOptions: {
            symbolRate: symbolRate,
            records: [
                {preamble: 4.0, bytes: FAKE_HEADER},
                {preamble: 2.0, bytes: data},
            ],
        },
    });
    return csaveNode;
}

/**
 * Audio renderers.
 */
class Renderer
{
    /**
     * Constructs an audio renderer object.
     *
     * @param {AudioContext} context an audio context
     */
    constructor(context)
    {
        this._audioContext = context;
    }

    get audioContext()
    {
        return this._audioContext;
    }

    async play()
    {
        await this.audioContext.resume();

        let csaveNode = createCsaveNode(this.audioContext);
        csaveNode.connect(this.audioContext.destination);

        let recorder = null;
        csaveNode.port.addEventListener("message", (event) => {
            if (event.data == "stopped") {
                if (recorder != null) {
                    recorder.stop();
                }
                csaveNode.disconnect();
            }
        });
        csaveNode.port.start();

        if ("MediaRecorder" in window) {
            let recorderNode = new MediaStreamAudioDestinationNode(this.audioContext);
            csaveNode.connect(recorderNode);

            let mediaType = "audio/webm";
            recorder = new MediaRecorder(recorderNode.stream, {
                mimeType: mediaType,
            });

            let chunks = [];
            recorder.addEventListener("dataavailable", (event) => {
                console.debug("recording data available");
                chunks.push(event.data);
            });
            recorder.addEventListener("stop", () => {
                produceFile(chunks, mediaType);
            });
            recorder.start(1000);
        }
    }
}

function produceFile(chunks, mediaType)
{
    let blob = new Blob(chunks, {
        type: mediaType,
    });

    let link = document.getElementById("download");
    link.href = URL.createObjectURL(blob);
    link.classList.remove("pure-button-disabled");
}

function doPlay(/* event */)
{
    renderer.play();
}

function bindCommands()
{
    for (let element of document.getElementsByClassName("app-command-play")) {
        element.addEventListener("click", doPlay);
        if (element.disabled) {
            element.disabled = false;
        }
    }
}

async function registerServiceWorker(name)
{
    let registration = await navigator.serviceWorker.register(name);
    console.debug("registered service worker: %o", registration);
}


registerServiceWorker("./service.js")
    .catch((error) => {
        console.warn("failed to register a service worker: %o", error);
    });

let AudioContext = window.AudioContext;
if (AudioContext == null) {
    AudioContext = window.webkitAudioContext;
}

let renderer = null;
if ("audioWorklet" in AudioContext.prototype) {
    let audioContext = new AudioContext();
    audioContext.audioWorklet.addModule("./resources/worklet.js")
        .then(() => {
            bindCommands();
            renderer = new Renderer(audioContext);
        });
}
else {
    alert("AudioWorklet support is missing.");
}

