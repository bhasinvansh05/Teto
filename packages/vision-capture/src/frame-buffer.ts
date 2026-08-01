/**
 * FrameBuffer — fixed-capacity ring buffer of recent frames.
 * Default capacity ~30 (~1s at 30fps).
 */

export const DEFAULT_FRAME_BUFFER_SIZE = 30;

export class FrameBuffer<T> {
  private readonly slots: Array<T | undefined>;
  private writeIndex = 0;
  private count = 0;

  constructor(readonly capacity: number = DEFAULT_FRAME_BUFFER_SIZE) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError("FrameBuffer capacity must be a positive integer");
    }
    this.slots = new Array<T | undefined>(capacity);
  }

  get size(): number {
    return this.count;
  }

  get isEmpty(): boolean {
    return this.count === 0;
  }

  get isFull(): boolean {
    return this.count === this.capacity;
  }

  /** Push a frame; overwrites the oldest when full. */
  push(frame: T): void {
    this.slots[this.writeIndex] = frame;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    if (this.count < this.capacity) this.count += 1;
  }

  /** Most recently pushed frame, or undefined if empty. */
  latest(): T | undefined {
    if (this.count === 0) return undefined;
    const index = (this.writeIndex - 1 + this.capacity) % this.capacity;
    return this.slots[index];
  }

  /** Oldest retained frame, or undefined if empty. */
  oldest(): T | undefined {
    if (this.count === 0) return undefined;
    if (this.count < this.capacity) return this.slots[0];
    return this.slots[this.writeIndex];
  }

  /**
   * Frames in chronological order (oldest → newest).
   * Length equals `size`.
   */
  toArray(): T[] {
    const out: T[] = [];
    if (this.count === 0) return out;
    const start =
      this.count < this.capacity
        ? 0
        : this.writeIndex;
    for (let i = 0; i < this.count; i++) {
      const idx = (start + i) % this.capacity;
      out.push(this.slots[idx] as T);
    }
    return out;
  }

  clear(): void {
    this.slots.fill(undefined);
    this.writeIndex = 0;
    this.count = 0;
  }
}
