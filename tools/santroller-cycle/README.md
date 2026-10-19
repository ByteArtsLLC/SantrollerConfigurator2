# santroller-cycle

Change a Santroller's cycling inputs (eg the pickup selector) from the PC, so you can switch them with
a keyboard shortcut instead of the button on the controller.

```sh
pip install -r requirements.txt
python santroller_cycle.py list         # Cycling input 3 (custom): 2222  [3333]  4444  5555
python santroller_cycle.py next 3       # step it forward (prev steps it back)
python santroller_cycle.py set 3 0      # jump straight to its first value
python santroller_cycle.py listen       # global hotkeys for every cycling input
```

`listen` binds ctrl+shift+F1 to step the first cycling input forward and ctrl+alt+shift+F1 to step it
back, F2 for the second and so on. Pick your own with `--bind` (pynput's key syntax), eg
`--bind '<ctrl>+<alt>+1=next:3' --bind '<ctrl>+<alt>+2=set:3:0'`.

- The controller needs firmware with `SetCycleCommand`, and has to be plugged in over USB in a mode
  that has the config interface (the same as the configurator needs). Older firmware ignores it.
- On Wayland global hotkeys don't work, so bind `next` / `prev` / `set` in your compositor instead, eg
  for Hyprland: `bind = CTRL ALT, 1, exec, python /path/to/santroller_cycle.py next 3`
- On macOS, the terminal needs the accessibility permission for `listen`.
- On Linux, your user needs access to the hidraw device, the same as for the configurator.
- `list` reads the whole config, which takes a couple of seconds and restarts the configurator's
  read of it if that is open at the same time. `next` / `prev` / `set` only send a command.
