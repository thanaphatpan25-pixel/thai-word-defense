export class ObjectPool<T> {
  private readonly free: T[] = [];
  private readonly create: () => T;
  private readonly reset: (item: T) => void;
  private readonly maxSize: number;

  constructor(create: () => T, reset: (item: T) => void, maxSize = 160) {
    this.create = create;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  acquire(): T { return this.free.pop() ?? this.create(); }

  release(item: T): void {
    this.reset(item);
    if (this.free.length < this.maxSize) this.free.push(item);
  }

  get available(): number { return this.free.length; }
}
