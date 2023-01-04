import { applyMiddlewares, container, defineCommand, INK_APP, Layout, setupInk } from '@jujulego/jill';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';

// Command
export default defineCommand({
  command: 'fancy',
  describe: 'Fancy hello world',
  builder: (yargs) =>
    applyMiddlewares(yargs, [
      setupInk
    ]),
  handler: () => {
    const app = container.get(INK_APP);

    app.rerender(
      <Layout>
        <Gradient name="rainbow">
          <BigText text="Hello world!" />
        </Gradient>
      </Layout>
    );
  }
});
