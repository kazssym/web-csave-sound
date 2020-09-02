# Introduction

This web application produces “CSAVE sounds” on the web browser in real-time.

“CSAVE” is a command used on some of the old BASIC implementations to save
programs on audio *cassette tapes*.

# Featured technologies

  - The [Web Audio API] is the core technology used to produce sounds on the
    web browser.

    The [AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)
    interface is the key feature of the API to process wave samples in real-time.

  - The [MediaStream Recording API] is used to make audio files.

# License

This program is licensed under [version 3 of the GNU Affero General Public
License][AGPL-3.0-or-later].

[AGPL-3.0-or-later]: https://spdx.org/licenses/AGPL-3.0-or-later.html
    "GNU Affero General Public License v3.0 or later"

# See also

  - The [Web Audio API], on MDN.

  - The [MediaStream Recording API], on MDN.

  - The [Kansas City standard](https://en.wikipedia.org/wiki/Kansas_City_standard),
    on Wikipedia.

[Web Audio API]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
[MediaStream Recording API]: https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API
