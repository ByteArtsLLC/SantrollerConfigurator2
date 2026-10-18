# Santroller Configurator 2

https://dev.santroller.com
## Desktop app

The same configurator is also packaged as a desktop app with [Tauri](https://tauri.app), for
browsers without WebHID. It needs [Rust](https://rustup.rs) and, on Linux, the
[Tauri prerequisites](https://tauri.app/start/prerequisites/).

- `yarn tauri:dev` runs it against the dev server
- `yarn tauri:build` builds an installer into `src-tauri/target/release/bundle`

On Linux the `.deb` and `.rpm` install a udev rule so controllers can be configured without root.
With the AppImage, copy `public/70-santroller.rules` to `/etc/udev/rules.d/` yourself.

Every push to `main` is released: the release workflow builds it for Linux, Windows and macOS and
publishes the installers once all three have built.

### Updates

The desktop app checks for a newer release when it starts (and every few hours), and offers to
install it. Releases are signed for this with a key kept in the repo's secrets:

- `TAURI_SIGNING_PRIVATE_KEY`: the contents of the private key
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: its password, if it has one

The app only installs updates signed by the key whose public half is in `src-tauri/tauri.conf.json`,
so keep a backup of the private key. Without it, installed copies can't be updated anymore, and
people would have to download the next release by hand.

## Versions

The configurator is versioned `major.minor.commits`: `major.minor` comes from `package.json`, and
the last number is how many commits the repo has, so it goes up with every release
(`node scripts/version.mjs` prints it). The firmware reports its own commit count as a build
number next to its commit hash, so the configurator can tell firmware newer than the one it ships
apart from older firmware, and won't offer to downgrade it.
 