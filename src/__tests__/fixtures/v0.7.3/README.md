# NaviDash 0.7.3 compatibility baseline

These fixtures freeze the first storage contract that NaviDash promises to migrate forward.
Keep the files unchanged when newer schemas are introduced; migration code and expectations should
adapt around them.

- `settings.json`: versioned server settings file.
- `widget-snapshot.json`: atomic Widget Snapshot v2 with independent desktop and mobile placements.
- `backup-v3.json`: application export format v3, including bookmarks and launcher learning data.
