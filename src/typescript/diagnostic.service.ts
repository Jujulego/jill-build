import { type Logger, Service } from '@jujulego/jill';
import { inject } from 'inversify';
import {
  DiagnosticCategory,
  type DiagnosticMessageChain,
  type DiagnosticRelatedInformation,
  getLineAndCharacterOfPosition
} from 'typescript';
import chalk from 'chalk';

import { ContextService } from '@/src/context.service';
import path from 'node:path';

// Service
@Service()
export class DiagnosticService {
  // Constructor
  constructor(
    @inject(ContextService)
    private readonly context: ContextService,
  ) {}
  
  // Methods
  private _formatLocation(diagnostic: DiagnosticRelatedInformation): string {
    if (!diagnostic.file || !diagnostic.start) {
      return '';
    }

    const filename = path.relative(this.context.cwd, diagnostic.file.fileName);
    const { line, character: char } = getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);

    return chalk.bold(`./${filename}:${line - 1}:${char + 1}`) + ' ';
  }

  private _formatMessage(diagnostic: DiagnosticRelatedInformation | DiagnosticMessageChain): string {
    // Format message
    const message = `${diagnostic.messageText} ${chalk.magenta('#TS' + diagnostic.code)}`;

    switch (diagnostic.category) {
      case DiagnosticCategory.Error:
        return chalk.red(message);

      case DiagnosticCategory.Warning:
        return chalk.yellow(message);

      case DiagnosticCategory.Suggestion:
        return chalk.blue(message);

      default:
        return message;
    }
  }

  private* _formatChain(chain: DiagnosticMessageChain): Generator<string, void, undefined> {
    yield this._formatMessage(chain);

    for (const child of chain.next ?? []) {
      for (const msg of this._formatChain(child)) {
        yield `  ${msg}`;
      }
    }
  }

  format(diagnostic: DiagnosticRelatedInformation): string {
    let message = this._formatLocation(diagnostic);

    if (typeof diagnostic.messageText === 'string') {
      message += this._formatMessage(diagnostic);
    } else {
      for (const msg of this._formatChain(diagnostic.messageText)) {
        message += msg + '\n';
      }
    }

    return message;
  }

  log(logger: Logger, diagnostic: DiagnosticRelatedInformation): void {
    const message = this.format(diagnostic);

    switch (diagnostic.category) {
      case DiagnosticCategory.Error:
        logger.error(message);
        break;

      case DiagnosticCategory.Warning:
        logger.warn(message);
        break;

      case DiagnosticCategory.Suggestion:
        logger.verbose(message);
        break;

      default:
        logger.info(message);
    }
  }
}
