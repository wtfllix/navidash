
import { getBookmarks, saveBookmarks, getBookmarksLastModified } from './src/lib/server/storage';
import { initialBookmarks } from './src/config/initialData';

async function verify() {
    console.log('Verifying Sync Logic...');

    // 1. Check initial version
    const v1 = await getBookmarksLastModified();
    console.log('Initial Version:', v1);

    // Wait a bit to ensure mtime changes (some FS have 1s resolution)
    await new Promise(r => setTimeout(r, 1100));

    // 2. Save bookmarks (simulating a change)
    console.log('Saving bookmarks...');
    await saveBookmarks(initialBookmarks);

    // 3. Check new version
    const v2 = await getBookmarksLastModified();
    console.log('New Version:', v2);

    if (v2 > v1) {
        console.log('SUCCESS: Version updated.');
    } else {
        // If v1 was 0 (file didn't exist), v2 should be > 0.
        // If file existed, v2 > v1.
        console.error(`FAILURE: Version did not update correctly. v1=${v1}, v2=${v2}`);
        process.exit(1);
    }
}

verify().catch(console.error);
