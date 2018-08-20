# advanced-tools-plugin-example

This plugin is a modified version of the [code found here](https://github.com/jpambrun/cornerstonePenBrushExperiment) by @jpambrun. The included license is set to match the ISC license specified in @jpambrun's `package.json`.

## TODO

_Need_

- Fix pointerevent `pressure` implementation
- Move hard dependencies to `npm dependencies`
- Fix commented out `simplifyPrecision`
- Restore touch functionality
- Restore GUI updates for radius
- Create/Destroy SVG layer in appropriate event hooks (instead of requiring extra DOM be added by hand)

_Want_

- Documentation boilerplate
- GitHub pages boilerplate
- Netlify boilerplate
- Publish to NPM boilterplate
- CI that verifies everything still jives with `cornerstone-tools` _peerDependency_
- Consider backporting `cursor` implementation to `cornerstone-tools`

_QA_

- Verify tool still works when applying viewport transformation
