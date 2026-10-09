import { cloneElement, isValidElement, Suspense, type ReactElement, type ReactNode } from 'react';

// Testing Library cannot render async server components: this awaits them and drops the Suspense boundaries.
// Client components are left as elements, so their hooks still run under render.
export async function settle(node: ReactNode): Promise<ReactNode> {
  if (Array.isArray(node)) return Promise.all(node.map(settle));
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.type === Suspense) return settle(element.props.children as ReactNode);
  if (typeof element.type === 'function' && element.type.constructor.name === 'AsyncFunction') {
    const resolve = element.type as (props: unknown) => Promise<ReactNode>;
    return settle(await resolve(element.props));
  }
  const props = Object.fromEntries(
    await Promise.all(
      Object.entries(element.props as Record<string, ReactNode>).map(async ([key, value]) => [key, await settle(value)]),
    ),
  );
  return cloneElement(element, props);
}
