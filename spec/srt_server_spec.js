const { SRT, SRTServer } = require('../index.js');

describe("SRTServer", () => {
  it("accepts once when several polls report the same pending connection", async () => {
    const LISTENER = 1;
    const CLIENT = 2;
    const server = new SRTServer(4242);
    await server._asyncSrt.dispose();

    let pending = true;
    let accepts = 0;
    server.socket = LISTENER;
    server._asyncSrt = {
      // like libsrt, the listener stays readable until the connection is accepted
      epollUWait: () => Promise.resolve(
        pending ? [{ socket: LISTENER, events: SRT.EPOLL_IN }] : []),
      getSockState: () => Promise.resolve(SRT.SRTS_LISTENING),
      // slow accept, as when the worker is busy with another call
      accept: () => new Promise((resolve) => {
        accepts++;
        setTimeout(() => { pending = false; resolve(CLIENT); }, 20);
      }),
      epollAddUsock: () => Promise.resolve(0),
    };
    let connections = 0;
    server.on('connection', () => connections++);

    server._pollEvents();
    await new Promise((resolve) => setTimeout(resolve, 100));
    clearTimeout(server._pollEventsTimer);

    expect(accepts).toBe(1);
    expect(connections).toBe(1);
  });
});
