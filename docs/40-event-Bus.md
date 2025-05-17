# 40 · event-Bus
_The global **publish–subscribe hub** for all micro-components_

---

Provides a mitt-based singleton with typed channels. Used to decouple data providers, logic workers, and UI components.

Key events include:

- `data.snapshot.loaded`
- `data.ws.status`
- `data.error`
- `ui.metric.select`
- `ui.mode.change`
- `ui.inspect`
- `config.ready`

Dev builds log all events to console.
