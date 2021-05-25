import React, { useMemo } from 'react';
import parser from './parser';
import reactify from './reactify';

interface ReactifyInterface {
  allowedTags?: object,
  children: any,
  sanitize?: Function,
}

export { parser, reactify };
const Reactify = (props: ReactifyInterface) => {
  const { allowedTags, children: rawChildren, sanitize } = props;

  // @ts-ignore
  const children = React.Children(rawChildren).toArray().map(String).join('');
  // @ts-ignore
  const tree = useMemo(() => reactify({ children, allowedTags, sanitize }), [children, allowedTags, sanitize]);

  return tree;
};

export default Reactify;