# ProPresenter Presentation Builder (propresenter-presentation-builder)

A tool to automatically build ProPresenter presentations based on a template presentation.

Still in development and not currently stable.

This is my first Electron app, so it's a bit rough.

Thanks to @greyshirtguy for reverse-engineering the ProPresenter [protobuf files](https://github.com/greyshirtguy/ProPresenter7-Proto)

## Template Setup

Create a Presentation in ProPresenter and add slides with the following labels:

- Title
- Point
- Verse

The Verse slide should contain two text boxes. One textbox named "Reference" or "Caption" for the verse reference, and one named "Text" for the verse text.

Set the font, size, color, etc of the text and insert `[TEXT]` where you want the generated content to be inserted.

Template slides can contain various cues, like Stage Display cues, Macros, Clear action cues, etc.

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
