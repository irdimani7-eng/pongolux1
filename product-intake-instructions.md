# Sending real product listings

Fill out `product-intake-template.csv` — one row per item — and send photos.
Here's exactly how each column maps, plus the easiest way to get photos to
me.

## The CSV columns

- **sku** — your own inventory SKU for this item (e.g. `PL-0001`). This is
  now also the item's web address (pongolux.com/product/**PL-0001**), so
  keep it short and stick to letters, numbers, and hyphens — no spaces or
  slashes. Every SKU must be unique.
- **brand** — e.g. `Chanel`, `Hermès`, `Louis Vuitton`.
- **model** — e.g. `Classic Flap Medium`, `Birkin 30`.
- **title** — the listing headline, e.g. `Classic Flap Medium in Black
  Caviar`. Feel free to reuse your Poshmark title. **Titles must be unique
  across your whole catalog** — if two similar bags would otherwise share a
  title, add a distinguishing detail (hardware color, size, a partial SKU).
- **description** — a few sentences: material, hardware, notable wear,
  what's included (dust bag, box, cards). Your Poshmark description is a
  great starting point — paste it in and I'll clean up the formatting.
- **category** (Type) — one of: `handbag`, `wallet`, `accessory`, `other`.
- **color** — the primary color, e.g. `Black`, `Tan`, `Etoupe`. Try to reuse
  the exact same spelling/capitalization across items of the same color
  (e.g. always `Black`, not sometimes `black`) — this becomes a shop filter,
  so consistent naming keeps items from splitting into near-duplicate
  filter options.
- **condition** — one of: `new`, `like_new`, `excellent`, `very_good`,
  `good`, `fair`.
- **price_usd** — whole dollars, no `$` or commas (e.g. `7499` for
  $7,499.00).
- **is_consignment** — `yes` if you're selling this on behalf of someone
  else, otherwise `no`.
- **photo_folder_name** — leave this matching the `sku` column; see below.

The shop page now has filters for Brand, Type, Color, Condition, and Price
range — brand and color options are pulled directly from whatever's in your
catalog, so they show up automatically as you add items.

## How the import actually works

Once you send a filled-in CSV plus the matching photo folders (one folder
per SKU, named `<sku>-anything`, exactly like the "Test products" folders
you already sent), I run `npm run db:import -- yourfile.csv photo-folder/`.
It matches each row to its photo folder by SKU, copies the photos into the
site, and publishes the listing. If a row is missing `price_usd` or
`condition`, its photos still get copied in (so we can preview them) but
that listing stays unpublished until those two fields are filled in and I
re-run the import — nothing gets published half-finished.

The first data row is a real example already in the sample catalog, so you
can see the format. Delete it (or leave it — I'll just skip duplicates)
before adding your own rows.

## Sending photos

There's no Google Drive connection available in this session yet, so the
most reliable path is uploading directly here in the chat:

1. On your computer, make one folder per item, named exactly like that
   item's `sku` (e.g. a folder called `PL-0001` containing that bag's
   photos — front, back, interior, hardware/date-code close-up).
2. Zip the parent folder containing all of those item folders.
3. Attach the zip file to this conversation (or drag-and-drop it in).

That naming match is what lets me tell which photos go with which row in
the CSV without you having to describe it separately.

If it's easier for you, connecting your computer through the Claude desktop
app (there's an "Add folder" option) also works — point me at wherever
you've downloaded the Google Drive photos locally, and I can read them
directly from there instead of a zip upload.

Send as many or as few as you have ready — even one complete row + one
photo folder is enough for me to wire up the first real listing and confirm
the format works before you do the rest.
