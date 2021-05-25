const PARSERERROR = 'parsererror';

type jsonValue = object | string | number | boolean;

enum NODE_TYPE {
  Element = 1,
  Text = 3,
};

const parser = (parseString: string): jsonValue => {
  const domParser = new DOMParser();

  const { documentElement } = domParser.parseFromString(parseString, 'text/html');

  if (documentElement.tagName === PARSERERROR || documentElement.firstElementChild?.tagName === PARSERERROR) {
    throw new Error(`Unable to parse provided HTML; ${documentElement.textContent}`);
  }

  return convertDOMtoJSON(documentElement);
};

export const convertDOMtoJSON = (domRoot: Node): jsonValue => {
  // character data node (text)
  if (domRoot instanceof CharacterData) {
    return domRoot.data;
  }

  // text node (text)
  if (domRoot.nodeType === NODE_TYPE.Text) {
    return domRoot.textContent;
  }

  // element?
  if (!(domRoot instanceof Element)) return null;

  // implicit `Element` from here on

  const tagName = domRoot.tagName.toLowerCase();
  const attributes: object = domRoot.getAttributeNames().reduce((attrs: object, attr: string): object => {
    attrs[attr] = domRoot.getAttribute(attr);
    return attrs;
  }, {});

  let children = null;
  
  if (domRoot.childNodes.length) {
    children = Array.from(domRoot.childNodes)
      .map(convertDOMtoJSON)
      .filter((child) => child !== null);
  }

  return {
    tagName,
    attributes,
    children,
  };
};

export default parser;