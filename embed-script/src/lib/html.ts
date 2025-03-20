/*
helper function to create html elements with named elements from strings.

Use as:

```ts
  import html from "./lib/html";

  const {a, b} = html`<div>
    <span name="a">a</span>
    <span name="b">b</span>
  </div>`;
```

If you install es6-string-html, you get HTML syntax highlighting and 
prettier support for HTML strings inside the html`` strings.

*/

function html(
  strings: TemplateStringsArray,
  ...values: any[]
): () => Record<string, HTMLElement> {
  const template = strings.reduce(
    (acc: string, str: string, i: number) => acc + str + (values[i] || ""),
    ""
  );
  return function () {
    const container = document.createElement("div");
    container.innerHTML = template;

    if (!container.innerHTML) {
      throw new Error("Invalid HTML template");
    }

    const elements: Record<string, HTMLElement> = {};

    container.querySelectorAll("[name]").forEach((el) => {
      const name = el.getAttribute("name");
      if (name) {
        elements[name] = el as HTMLElement;
        el.removeAttribute("name");
      }
    });

    const fragment = document.createDocumentFragment();
    while (container.firstChild) {
      fragment.appendChild(container.firstChild);
    }

    return elements;
  };
}

export default html;
