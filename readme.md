# Barcode E-Reader

An experiment in using barcodes as a storage medium.

The intent is to create an EPUB reader that stores its data on paper, and is entirely contained in-browser.

## Running

It is a self-contained web app, and therefore has no build dependancies, though it does have a few CORS calls that require it to be served.

1. serve: `./www` on `127.0.0.1`
2. nav: `http://lvh.me/index.html`

## Quick Usage

This is a basic walk through of functionality. Suitable for a quick demo of how it is intended to be used.

1. Open the `Catalogue` tab
2. Upload an EPub
3. Click Encode Button (checkerboard)
4. Open a private browsing mode session
5. Open the `Decode` tab
6. Click `Monitor`
7. Select the window with the current codes
8. Change to `Catalogue` tab
9. Wait for `100%`
10. `Save`

You should have a copy of the file transfered to the new browser instance via images. More complex usage would be to print to paper and load via camera.


## FAQ

1. Is this worth persuing?

   Depending on the volume of data that can be stored on paper, this may not be worth doing at all. The time taken to scan a document into the reader may exceed the usefulness of the process.

## Resources

- https://github.com/zxing-js/library
- https://www.smashingmagazine.com/2015/01/designing-for-print-with-css/

