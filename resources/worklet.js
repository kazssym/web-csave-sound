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
 * Default symbol rate.
 */
const DEFAULT_SYMBOL_RATE = 1200;

/**
 * Default value for the amplitude.
 */
const DEFAULT_AMPLITUDE = 0.125;

/**
 * Audio worklet processor that generates classic *CSAVE* sound.
 *
 * @param {*} options options for the processor
 */
class CsaveProcessor extends AudioWorkletProcessor
{
    constructor(options)
    {
        super(options);

        let processorOptions = options.processorOptions;
        if (processorOptions == null) {
            processorOptions = {};
        }

        this._symbolRate = processorOptions.symbolRate;
        if (this._symbolRate == null || this._symbolRate == 0) {
            this._symbolRate = DEFAULT_SYMBOL_RATE;
        }

        this._records = processorOptions.records;
        if (this._records == null) {
            this._records = [];
        }

        this._amplitude = DEFAULT_AMPLITUDE;
        // Ratios of the carrier frequencies to the sample rate.
        this._increments = [1200 / sampleRate, 2400 / sampleRate];

        this._phase = 0;
        this._wave = this._generateWave(...this._records);
    }

    _advance(increment)
    {
        let sample = this._amplitude * Math.sin(2 * Math.PI * this._phase);
        this._phase += increment;
        this._phase -= Math.floor(this._phase);
        return sample;
    }

    * _generateWave(...records)
    {
        let sampleCount = 0;
        for (let record of records) {
            let preamble = record.preamble;
            if (preamble == null) {
                preamble = 1.0;
            }

            sampleCount += preamble * sampleRate;
            while (sampleCount > 0) {
                sampleCount -= 1;
                yield this._advance(this._increments[1]);
            }

            for (let byte of record.bytes) {
                byte = 0x60 | ((byte & 0xff) << 1);
                while (byte != 0) {
                    let increment = this._increments[byte & 0x1];
                    byte >>= 1;

                    sampleCount += sampleRate / this._symbolRate;
                    while (sampleCount > 0) {
                        sampleCount -= 1;
                        yield this._advance(increment);
                    }
                }
            }
        }
        return 0;
    }

    process(_inputs, outputs, /* parameters */)
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


registerProcessor("csave-processor", CsaveProcessor);
