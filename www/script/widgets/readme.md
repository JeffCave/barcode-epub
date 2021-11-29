# Widgets (MDN Web Components)

[Widgets](https://en.wikipedia.org/wiki/Widget#Computing) are visual components
to be used in software. Generally, they are considered self-contained
units, maximizing reusability. This folder is where all the visual components
we create are placed (to distinguish them from the back-end stuff).

In order to create a reactive application, this collection of Widgets
are made using Web Components are built using
[Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components).
Web Components are a W3C standard built into the browser to all allow
for the creastion of custom HTML elements.

These widgets have been taken from the project [MISS](https://gitlab.com/jefferey-cave/miss)
and were built for that project. By convention, these widgets have been
named "ps-*". The `PS` namespace is used by [Plaid Sheep](https://plaidsheep.ca/),
a now defunct development company.

Ideally, these should conform to Material design, and could use "Material
Components". Further, these should be separated into their own project
for reuse, however that should only be done after their third use because
[reusability in the large is difficult](https://amzn.to/3oUqwMM)

[[_TOC_]]

## Special Cases

While most of the widgets are based on Web Components, there are a few
that were written on a whim and turned out to be worth keeping. They should
(some day) be turned into reusable components.

### pageTOC

[🗎](https://gitlab.com/dpub/barcode-epub/-/blob/master/www/lib/widgets/pageTOC.js)

`pageTOC` constructs scans a webpage for header elements and constructs
a nested Table of Contents referencing each element. Useful for blog posts
and books as it can create a sidebar TOC from any (well formatted) content.

> **NOTE**
>
> This is not a web-component, because it was written as an demonstration
> for students.

### unicons
[🗎](https://gitlab.com/dpub/barcode-epub/-/blob/master/www/lib/widgets/unicons.js)

A collection of Unicode characters that correspond to various icons. Characters
were originally preferred because of their small footprint, fast load
time, and ability to have a colour applied to them to fit with a theme.

Since unicode has begun issuing images with color, this has broken the
concept of "text", making this less useful.

All icon names correspond to those specified in Material Design icon set:
https://unicode-table.com/en/blocks/miscellaneous-symbols-and-pictographs/


### ~all
[🗎](https://gitlab.com/dpub/barcode-epub/-/blob/master/www/lib/widgets/~all.js)

A best practice is to load only components that you intend to use. This
reduces teh footprint of yoru application by not loading elemetns that
are not required. If they doing anything, don't put them in memory.

Sometimes we are lazy. This library loads all the widgets.

## psAlert

[🗎](https://gitlab.com/dpub/barcode-epub/-/blob/master/www/lib/widgets/psAlert.js)

Acts as a place holder to display messages to the user.

These popups are used to display error messages, and warnings. The Alert
component should display messages without interfering with the user's
flow. So never write thsi to be a modal pop-up.

## psFileDrop

[🗎](https://gitlab.com/dpub/barcode-epub/-/blob/master/www/lib/widgets/psFileDrop.js)

A file uploader. Support drag and drop of files as well as click to open.

Emits an event when files are loaded

## psPanelElement
[🗎](https://gitlab.com/dpub/barcode-epub/-/blob/master/www/lib/widgets/psPanelElement.js)

The concept behind a "Panel" is that it is a "space" on which to put actual
visible things on a page. It is a container for interactive elements.

It has a `title` and an `icon` (unicode character), and then will distribute
its contents across a page as is appropriate for its parent container
and state.

They generally have the ability to be `minimized`, `maximized`, `restored`, or `hidden`.

## psProgress
[🗎](https://gitlab.com/dpub/barcode-epub/-/blob/master/www/lib/widgets/psProgress.js)

A `progress` element that is responsive to elements that emit a `progress-event`

``` mermaid
graph LR
    classDef current fill:#FFFFFF00,stroke:#333,stroke-width:4px;
    psProgress:::className -->
    HTMLProgressElement -->
    HTMLElement -->
    Element -->
    Node -->
    EventTarget

```

Progress bars are designed to display progression from a start to an end-point.
`psProgress` was put together as a way to make the standard HTML progress
element responsive to
[progress events](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/progress_event).

Progress events get emitted by various elements and background events
to notify the front-end of "progress" toward completion. `psProgress`
is designed to subscribe to these published events and display the resulting
progress.

`psProgress` a progress aggregator. It can subscribe to multiple progress
emitters, taking the sum of their progress and the sum of their max value
as it's progress. On each update, it emits a progress event of its own.
This is useful in gantt style diagrams to demonstrate cumulative progress
of a workflow or multiple workflows running in parallel.

A good example comes from MISS, where the comparitive analysis of code
spans thousands of lines being compared to thousands of lines in a cartesian
fashion. The comparator can know how many comparisons need to be performed,
but it takes hours to perform the comparisons. It's nice to tell the world
how things are going. The progress reports on the progress of each comparison
as well as the aggregate of teh comparisons being run in parallel.


### Examples


### Properties

Inherits: [`progress`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress)

#### max

An `integer` reflecing the content attribute of the same anem, limited to integers greater than zero.

#### value

An `integer` that reflects the current value.

#### title

The content to be displayed in teh progress bar itself. `HTMLProgressElement` does allow for content to be placed `innerHTML`, but does nto display it. This is a failing we have rectified.

### Methods


### See Also

* [HTML Media Events](https://html.spec.whatwg.org/multipage/media.html#event-media-progress)
* [Progress Events](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/progress_event)
* [Progress Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress)

## psTabbedPanelElement
[🗎](https://gitlab.com/dpub/barcode-epub/-/blob/master/www/lib/widgets/psTabbedPanelElement.js) is...description

Inherits: [`psPanelElement`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress)

While itself a "panel", this is a container that displays panels as a
tabbed list. The icon and title are taken from each child panel and formed
into a menu for selecting the currently visible element.

## psTreeView
[🗎](https://gitlab.com/dpub/barcode-epub/-/blob/master/www/lib/widgets/psTreeView.js)

Inherits: [`psPanelElement`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress)


A panel which contains a hiearchical tree of elements. This was originally
developed for folder path navigation of zip files.

