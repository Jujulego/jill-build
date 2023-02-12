import { Service } from '@jujulego/jill';
import { WorkerPool } from '@jujulego/tasks';
import { decorate, injectable, unmanaged } from 'inversify';
import { Worker } from 'node:worker_threads';
import type * as ts from 'typescript';

import { LazyTsconfig } from '@/src/middlewares/ts-config.middleware';

// Pool
@Service()
export class TsBuildPool extends WorkerPool {
  // Attributes
  @LazyTsconfig()
  readonly tsconfig: ts.ParsedCommandLine;

  // Constructor
  constructor() {
    super(1);
  }

  // Methods
  protected _start() {
    return new Worker(/* webpackChunkName: "ts-build.worker" */ new URL('./ts-build.worker.ts', import.meta.url), {
      workerData: this.tsconfig,
    });
  }
}

// Bind
decorate(injectable(), WorkerPool);
decorate(unmanaged(), WorkerPool, 0);
