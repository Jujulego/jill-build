import { container, Logger } from '@jujulego/jill';
import { WorkerTask } from '@jujulego/tasks';
import type { interfaces as int } from 'inversify';

import { TsBuildPool } from './ts-build.pool';
import { type TsBuildMessage } from './ts-build.message';

// Class
export class TsBuildTask extends WorkerTask {
  // Attributes
  readonly name = 'ts-build';

  // Constructor
  constructor(
    pool: TsBuildPool,
    logger: Logger,
    payload: TsBuildMessage,
  ) {
    super(pool, payload, {}, { logger });
  }
}

// Factory
export const TsBuildFactory: int.ServiceIdentifier<(files: string[]) => TsBuildTask> = Symbol('jujulego:jill-build:TsBuildFactory');

container.bind(TsBuildFactory).toFactory(() => (files: string[]) => {
  const pool = container.get(TsBuildPool);
  const logger = container.get(Logger);

  return new TsBuildTask(pool, logger, { files });
});
