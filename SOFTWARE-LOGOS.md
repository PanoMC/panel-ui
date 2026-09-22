# Server software logos

The brand marks the panel shows next to the name of a Minecraft server software, in the
create-server and create-network wizards and on the server cards and header.

They are **bundled with the panel on purpose**: nothing here is hot-linked, so the panel makes no
request to a third-party site while rendering a page. `src/lib/software.util.js` is the only
place that maps a software id to one of these files, and
`src/lib/components/servers/SoftwareLogo.svelte` renders them.

| File           | Software                          | Source                                                                                     |
| -------------- | --------------------------------- | ------------------------------------------------------------------------------------------ |
| `papermc.svg`  | Paper, Folia, Velocity, Waterfall | `https://assets.papermc.io/brand/papermc_logo.min.svg`                                     |
| `purpur.svg`   | Purpur                            | `https://purpurmc.org/images/purpur.svg`                                                   |
| `spigot.png`   | Spigot, BungeeCord                | `https://static.spigotmc.org/img/spigot.png`                                               |
| `fabric.png`   | Fabric                            | `https://fabricmc.net/assets/logo.png`                                                     |
| `quilt.svg`    | Quilt                             | `https://quiltmc.org/assets/img/logo.svg`                                                  |
| `forge.png`    | Forge                             | `https://files.minecraftforge.net/static/images/apple-touch-icon.png` (resized to 128×128) |
| `neoforge.png` | NeoForge                          | `https://neoforged.net/img/authors/neoforged.png`                                          |

Notes:

- Paper, Folia, Velocity and Waterfall are all **PaperMC** projects and share the PaperMC mark —
  the projects do not publish separate square marks.
- BungeeCord is a **SpigotMC** project and uses the Spigot mark for the same reason.
- **Vanilla** deliberately has no file here. "Minecraft" is a Mojang/Microsoft trademark, so the
  panel reuses its own neutral cube icon (`../minecraft-icon.png`) instead.
- Every SVG was checked to be well-formed XML with no `<script>`, no event handlers and no
  remote references.

Each mark is the property of its own project and is used here only to **identify** the software
it names, beside that software's own name. Pano is not affiliated with, endorsed by, or
sponsored by any of these projects. If a project's trademark or brand policy asks for different
treatment, replace or remove the file here and drop the `logo` for that id in
`src/lib/software.util.js` — the component falls back to a Font Awesome icon on its own.
