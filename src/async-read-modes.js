const { SRT } = require('../build/Release/node_srt.node');

const READ_BUF_SIZE = 16 * 1024;

/**
 * Reads at least `minBytesRead` bytes asynchronously from an SRT socket.
 *
 * @param {AsyncSRT} asyncSrt - Instance of asynchronous SRT socket
 * @param {number} socketFd - Socket file descriptor
 * @param {number} minBytesRead - Minimum number of bytes to read
 * @param {number} [readBufSize=READ_BUF_SIZE] - Buffer size for reading
 * @param {Function} [onRead=null] - Callback invoked after each successful read
 * @param {Function} [onError=null] - Callback invoked upon error
 * @returns {Promise<Uint8Array[]>} - Array of read chunks
 */
async function readChunks(
  asyncSrt,
  socketFd,
  minBytesRead,
  readBufSize = READ_BUF_SIZE,
  onRead = null,
  onError = null
) {
  let bytesRead = 0;
  const chunks = [];

  while (bytesRead < minBytesRead) {
    try {
      const readBuf = await asyncSrt.read(socketFd, readBufSize);

      if (readBuf instanceof Uint8Array && readBuf.byteLength > 0) {
        bytesRead += readBuf.byteLength;
        chunks.push(readBuf);
        if (typeof onRead === 'function') {
          onRead(readBuf);
        }
      } else if (readBuf === null || readBuf === SRT.ERROR) {
        if (typeof onError === 'function') {
          onError(readBuf);
        }
        throw new Error(`SRT read error: ${readBuf}`);
      } else {
        throw new Error('Unexpected read result from asyncSrt');
      }
    } catch (err) {
      if (typeof onError === 'function') {
        onError(err);
      }
      throw err;
    }
  }

  return chunks;
}

module.exports = {
  READ_BUF_SIZE,
  readChunks,
};
