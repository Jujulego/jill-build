import { container, Logger } from '@jujulego/jill';
import { WorkerTask } from '@jujulego/tasks';
import type { interfaces as int } from 'inversify';
import type * as ts from 'typescript';

import { TsBuildPool } from './ts-build.pool';
import { TsDiagnosticService } from './ts-diagnostic.service';

// Class
export class TsBuildTask extends WorkerTask {
  // Attributes
  readonly name = 'ts-build';

  // Constructor
  constructor(
    pool: TsBuildPool,
    private readonly diagnostics: TsDiagnosticService,
    logger: Logger,
  ) {
    super(pool, {}, {}, { logger });
  }

  // Methods
  protected _handleEvent(payload: ts.Diagnostic) {
    this.diagnostics.log(payload);
  }
}

// Factory
export const TsBuildFactory: int.ServiceIdentifier<() => TsBuildTask> = Symbol('jujulego:jill-build:TsBuildFactory');

container.bind(TsBuildFactory).toFactory(() => () => {
  const pool = container.get(TsBuildPool);
  const diagnostics = container.get(TsDiagnosticService);
  const logger = container.get(Logger);

  return new TsBuildTask(pool, diagnostics, logger);
});
