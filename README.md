# ProPresenter Presentation Builder (propresenter-presentation-builder)

A tool to automatically build ProPresenter presentations based on a template presentation.

Still in development and not currently stable.

This is my first Electron app, so it's a bit rough.

Thanks to @greyshirtguy for reverse-engineering the ProPresenter [protobuf files](https://github.com/greyshirtguy/ProPresenter7-Proto)

## Disclaimer

Use this softwware at your own risk. **It is not supported by Renewed Vision!** Please do not contact Renewed Vision for support.

There is no guarantee that this software won't corrupt your ProPresenter files or otherwise cause your computer to explode. It is always wise to maintain backups of important files on your system.

## Template Setup

Check the [wiki](https://github.com/cgarwood/propresenter-presentation-builder/wiki) for documentation on setting up templates.

## Development

### Install the dependencies

```bash
yarn global add @quasar/cli
yarn
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev -m electron
```

### Build the app for production

```bash
quasar build -m electron
```
