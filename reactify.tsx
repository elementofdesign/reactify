import React, { Fragment } from 'react';
import parser from './parser';

export const RENAME = '__rename'; // for renaming attributes
export const SANITIZE = '__sanitize'; // tag sanitizer/rewriter
export const TAGNAME = RENAME; // for renaming tags

const className = {
  'class': {
    [RENAME]: 'className',
  },
};

const defaults = { ...className };

const cachedRegex = {};

export const defaultAllowedTags: object = {
  a: {
    ...defaults,
    href: true,
    rel: ['noreferrer'],
    target: ['', '_blank'],
    [SANITIZE]: (attrs) => {
      const { target } = attrs;

      // enforce `rel="noreferrer"` when `target="_blank"`
      if (target?.toLowerCase() === '_blank') return {
        ...attrs,
        rel: 'noreferrer',
      };

      return attrs;
    },
  },
  article: { ...defaults },
  b: { ...defaults },
  br: {
    ...defaults,
    __children: false,
  },
  div: { ...defaults },
  em: { ...defaults },
  h1: { ...defaults },
  h2: { ...defaults },
  h3: { ...defaults },
  h4: { ...defaults },
  h5: { ...defaults },
  h6: { ...defaults },
  i: { ...defaults },
  p: { ...defaults },
  section: { ...defaults },
  span: { ...defaults },
  strong: { ...defaults },
};
Object.freeze(defaultAllowedTags); // TODO freeze deeply

export const disallowedTags = ['script'];
Object.freeze(disallowedTags);

export const disallowedAttributes = ['on*'];
Object.freeze(disallowedAttributes);

export const defaultSanitize = (root) => root;

const reactify = ({ allowedTags = defaultAllowedTags, children, sanitize = defaultSanitize }) => {
  const parsed = parser(children);
  return reactifyParsed({ allowedTags, parsed, sanitize });
};

export const reactifyParsed = ({ allowedTags = defaultAllowedTags, parsed, sanitize = defaultSanitize }) => {

  if (parsed === null) return null; // unable to parse

  if (typeof parsed === 'string') return <Fragment key={parsed}>{parsed}</Fragment>;

  const elems = [];
  const keys = {};

  for (const parsedNode of parsed) {

    if (typeof parsedNode === 'string') {
      elems.push(<Fragment key={parsedNode}>{parsedNode}</Fragment>);
      continue;
    }

    const { tagName, attributes, children: childElems } = parsedNode;
    
    // validate
    if (disallowedTags.includes(tagName)) continue;
    if (!(tagName in allowedTags)) continue;

    // get the tag definition and handle renames
    const tagDef = allowedTags[tagName];
    const Tag = tagDef[TAGNAME] || tagName;

    // get the key
    keys[Tag] = (keys[Tag] || 0) + 1;
    const key = `${Tag}_${keys[Tag]}`;
    
    const tagAttributes = Object.entries(attributes)

      // remove disallowed
      .filter(([attr]) => (attr in tagDef) && !/^__/.test(attr))

      // remap
      .reduce((attrs, [attr, attrValue]: [string, string]) => {
        const attrDef = tagDef[attr];
        const defIsObject = typeof attrDef === 'object';
        const defIsArray = defIsObject && attrDef instanceof Array;
        let allowedValues: string[] = null;
        if (defIsObject) {
          if (defIsArray)
            allowedValues = attrDef;
          else if (attrDef.allowed)
            allowedValues = attrDef.allowed;
        }
        const attrName = (defIsObject && attrDef[RENAME]) || attr;

        // allowed attribute name?
        if (disallowedAttributes.some((disallowed) => {
          if (disallowed.toLowerCase() === attrName.toLowerCase()) return true;
          if (/[\*\?]/.test(disallowed)) {
            let regex = cachedRegex[disallowed];

            if (!regex) {
              const regexStr = disallowed.replace(/\*/g, '.*').replace(/\?/g, '.');
              const regex = new RegExp(`^${regexStr}`, 'i');
              cachedRegex[disallowed] = regex;
            }

            if (regex.test(attrName)) return true;
          }

          return false;
        })) return attrs;

        // allowed value?
        const valuePermitted = !allowedValues || allowedValues.includes(attrValue);

        if (!valuePermitted) return attrs;

        return {
          ...attrs,
          [attrName]: attrValue,
        };
      });

    const sanitizer = tagDef[SANITIZE] || ((attrs) => attrs);
    const sanitizedAttributes = sanitizer(tagAttributes);

    const reactChildElems = childElems && reactifyParsed({ allowedTags, parsed: childElems, sanitize });

    elems.push(<Tag {...sanitizedAttributes} key={key}>{reactChildElems}</Tag>);
  }

  return elems;
};

export default reactify;