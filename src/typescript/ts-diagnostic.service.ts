import { Logger, Service } from '@jujulego/jill';
import { inject } from 'inversify';
import {
  DiagnosticCategory,
  type DiagnosticMessageChain,
  type DiagnosticRelatedInformation,
} from 'typescript';
import chalk from 'chalk';

import { ContextService } from '@/src/context.service';
import path from 'node:path';

// Service
@Service()
export class TsDiagnosticService {
  // Constructor
  constructor(
    @inject(ContextService)
    private readonly context: ContextService,
    @inject(Logger)
    private readonly logger: Logger,
  ) {}
  
  // Methods
  private _formatLocation(diagnostic: DiagnosticRelatedInformation): string {
    if (!diagnostic.file || !diagnostic.start) {
      return '';
    }

    const filename = path.relative(this.context.cwd, diagnostic.file.fileName);
    const { line, character: char } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);

    return chalk.bold(`${filename}:${line + 1}:${char + 1}`) + ' ';
  }

  private _formatLine(line: number | null, max: number): string {
    const width = max.toString().length;
    const txt = line === null ? '' : line.toString();

    return chalk.grey(' '.repeat(width - txt.length) + txt + ' |');
  }

  private _extractFileLines(diagnostic: DiagnosticRelatedInformation): string {
    if (!diagnostic.file || !diagnostic.start) {
      return '';
    }

    // Compute lines
    const pos = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    const firstLine = Math.max(pos.line - 2, 0);
    const lastLine = Math.min(pos.line + 3, diagnostic.file.getLineAndCharacterOfPosition(diagnostic.file.end).line);

    const result: string[] = [];

    for (let line = firstLine; line < lastLine; ++line) {
      const start = diagnostic.file.getPositionOfLineAndCharacter(line, 0);
      const end = diagnostic.file.getLineEndOfPosition(start);

      result.push(`${this._formatLine(line + 1, lastLine)} ${chalk.reset(diagnostic.file.text.slice(start, end))}`);

      if (line === pos.line) {
        result.push(`${this._formatLine(null, lastLine)} ${' '.repeat(pos.character)}${'^'.repeat(diagnostic.length ?? 1)}`);
      }
    }

    return result.join('\n');
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
      message += Array.from(this._formatChain(diagnostic.messageText)).join('\n');
    }

    const lines = this._extractFileLines(diagnostic);

    if (lines) {
      message += '\n' + this._extractFileLines(diagnostic);
    }

    return message;
  }

  log(diagnostic: DiagnosticRelatedInformation, logger: Logger = this.logger): void {
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
