// worklet.js
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
 * ES module for the audio worklet processors.
 *
 * @module worklet.js
 */

/* global sampleRate */

const RENDER_QUANTUM = 128;

/**
 * Default value for the amplitude.
 */
const DEFAULT_AMPLITUDE = 0.125;

/**
 * Audio worklet processor that generates classic *CSAVE* sound.
 *
 * @param {*} options options for the processor
 */
export class CsaveProcessor extends AudioWorkletProcessor
{
    constructor(options)
    {
        super(options);
        this._amplitude = DEFAULT_AMPLITUDE;
        this._bitRate = 1200;
        this._increments = [1200 / sampleRate, 2400 / sampleRate];

        this._phase = 0;

        let testData = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57];
        testData = testData.concat(testData);
        testData = testData.concat(testData);
        testData = testData.concat(testData);
        this._wave = this._generateWave(2 * sampleRate, testData);
    }

    _advance(increment)
    {
        let sample = this._amplitude * Math.sin(2 * Math.PI * this._phase);
        this._phase += increment;
        this._phase -= Math.floor(this._phase);
        return sample;
    }

    *_generateWave(preambleDuration, sequence)
    {
        while (preambleDuration-- > 0) {
            yield this._advance(this._increments[1]);
        }
        for (let byte of sequence) {
            byte = 0x20 | (byte << 1);
            while (byte != 0) {
                let duration = sampleRate / this._bitRate;
                while (duration-- > 0) {
                    yield this._advance(this._increments[byte & 0x1]);
                }
                byte >>= 1;
            }
        }
        return 0;
    }

    process(inputs, outputs, /* parameters */)
    {
        if (outputs.length >= 1) {
            let k = 0;
            while (k < RENDER_QUANTUM) {
                let {value, done} = this._wave.next();
                if (done) {
                    break;
                }
                for (let output of outputs) {
                    for (let channel of output) {
                        channel[k] = value;
                    }
                }
                k++;
            }
            return k > 0;
        }
        return false;
    }
}


console.debug("sample rate: %d", sampleRate);

registerProcessor("csave-processor", CsaveProcessor);
