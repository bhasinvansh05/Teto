import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FrameBuffer, DEFAULT_FRAME_BUFFER_SIZE } from "./frame-buffer.js";

describe("FrameBuffer", () => {
  it("defaults capacity to ~30", () => {
    const buf = new FrameBuffer<number>();
    assert.equal(buf.capacity, DEFAULT_FRAME_BUFFER_SIZE);
    assert.equal(DEFAULT_FRAME_BUFFER_SIZE, 30);
  });

  it("pushes and reports size / latest / oldest", () => {
    const buf = new FrameBuffer<number>(3);
    assert.equal(buf.isEmpty, true);
    buf.push(1);
    buf.push(2);
    assert.equal(buf.size, 2);
    assert.equal(buf.latest(), 2);
    assert.equal(buf.oldest(), 1);
    assert.deepEqual(buf.toArray(), [1, 2]);
  });

  it("overwrites oldest when full (ring)", () => {
    const buf = new FrameBuffer<string>(3);
    buf.push("a");
    buf.push("b");
    buf.push("c");
    assert.equal(buf.isFull, true);
    assert.deepEqual(buf.toArray(), ["a", "b", "c"]);

    buf.push("d");
    assert.equal(buf.size, 3);
    assert.deepEqual(buf.toArray(), ["b", "c", "d"]);
    assert.equal(buf.oldest(), "b");
    assert.equal(buf.latest(), "d");

    buf.push("e");
    buf.push("f");
    assert.deepEqual(buf.toArray(), ["d", "e", "f"]);
  });

  it("clear resets state", () => {
    const buf = new FrameBuffer<number>(2);
    buf.push(10);
    buf.push(20);
    buf.clear();
    assert.equal(buf.size, 0);
    assert.equal(buf.latest(), undefined);
    assert.deepEqual(buf.toArray(), []);
  });

  it("rejects invalid capacity", () => {
    assert.throws(() => new FrameBuffer(0), RangeError);
    assert.throws(() => new FrameBuffer(-1), RangeError);
    assert.throws(() => new FrameBuffer(1.5), RangeError);
  });
});
