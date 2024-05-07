import twemoji from "twemoji";

import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token";
import markdownitEmoji from "markdown-it-emoji";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

md.use(markdownitEmoji);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
md.renderer.rules.emoji = (token: Token, idx: Number) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return twemoji.parse(token[idx].content, {
    base: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/"
  });
};

export const markdown = (text: string) => {
  return md.renderInline(text);
};

export const markdownDescription = (description: string, subtypes: string) => {
  let textPopUp = '';
  if (subtypes){
    textPopUp = md.render('**Subtypes: ' + subtypes.replaceAll('|', ','))
  }
  if (description){
    textPopUp = textPopUp + md.renderInline(description)
  }
  return (textPopUp? textPopUp: 'No Description');
};