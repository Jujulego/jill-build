import simple from './simple';

export default function complex(a: number, b: number) {
  return simple(simple(a, b), b);
}
