import { type Logger } from '@jujulego/jill';
import { type Diagnostic, DiagnosticCategory, type DiagnosticMessageChain, type DiagnosticRelatedInformation } from 'typescript';
import chalk from 'chalk';

// Utils
function formatMessage(diagnostic: DiagnosticRelatedInformation | DiagnosticMessageChain): string {
  // Format message
  const message = `${diagnostic.messageText} ${chalk.magenta('#' + diagnostic.code)}`;

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

function* formatChain(chain: DiagnosticMessageChain): Generator<string, void, undefined> {
  yield formatMessage(chain);

  for (const child of chain.next ?? []) {
    for (const msg of formatChain(child)) {
      yield `  ${msg}`;
    }
  }
}

function formatDiagnostic(diagnostic: DiagnosticRelatedInformation): string {
  let message = '';

  if (typeof diagnostic.messageText === 'string') {
    message = formatMessage(diagnostic);
  } else {
    for (const msg of formatChain(diagnostic.messageText)) {
      message += msg + '\n';
    }
  }

  return message;
}

export function logDiagnostic(logger: Logger, diagnostic: Diagnostic): void {
  const message = formatDiagnostic(diagnostic);

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
