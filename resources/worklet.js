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

/* global sampleRate */

/**
 * Module script for the audio worklet processors.
 * This file must be imported by an
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet AudioWorklet}
 * object.
 *
 * @module worklet.js
 */

// This file is a module script and shall be in strict mode by default.
"";

/**
 * Default value for the symbol rate.
 */
const DEFAULT_SYMBOL_RATE = 1200;

/**
 * Default value for the amplitude.
 */
const DEFAULT_AMPLITUDE = 0.125;

/**
 * Audio worklet processors that produce *CSAVE sounds*.
 *
 * The symbol rate may be specified by `options.processorOptions.symbolRate`.
 * Its default value is 1200 (symbols per second).
 *
 * The amplitude may by specified by `options.processorOptions.amplitude`.
 * Its default value is 0.125, which is -18 dBFS.
 */
class CsaveProcessor extends AudioWorkletProcessor
{
    /**
     * Constructs an audio worklet processor.
     *
     * @param {Object} options options for the new processor
     */
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
        this._running = true;
        this._wave = this._generateWave(...this._records);
    }

    /**
     * Advances the phase to return a wave sample.
     *
     * @param {number} increment an increment of the phase to advance
     * @return {number} a wave sample
     */
    _advance(increment)
    {
        let sample = this._amplitude * Math.sin(2 * Math.PI * this._phase);
        this._phase += increment;
        this._phase -= Math.floor(this._phase);
        return sample;
    }

    /**
     * Returns a generator function for wave samples.
     *
     * @param {...Object} records record descriptions
     * @param {number[]} records[].bytes the data for a record
     * @param {number} [records[].preamble=1.0] the preamble duration for a record
     * @return {GeneratorFunction<number>} a generator function to yield wave samples
     */
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

            for (const byte of record.bytes)
            {
                const stop_bits = 0x300;
                for (let bits = (stop_bits | (byte & 0xff)) << 1; bits != 0; bits >>= 1)
                {
                    let increment = this._increments[bits & 0x1];

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
        if (outputs.length >= 1 && this._running) {
            let k;
            for (k = 0; k < outputs[0][0].length; k++) {
                let {done, value: sample} = this._wave.next();
                if (done) {
                    break;
                }
                outputs.forEach((output) => {
                    output.forEach((channel) => {
                        channel[k] = sample;
                    });
                });
            }
            if (k > 0) {
                return true;
            }

            this._running = false;
            this.port.postMessage("stopped");
        }
        return false;
    }
}

registerProcessor("csave-processor", CsaveProcessor);
