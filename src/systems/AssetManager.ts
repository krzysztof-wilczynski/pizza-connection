export class AssetManager {
    private assets: Map<string, HTMLImageElement> = new Map();

    public async loadAsset(key: string, path: string): Promise<void> {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                console.warn(`Failed to fetch asset: ${path} - Status: ${response.status}`);
                return;
            }
            const svgText = await response.text();
            const blob = new Blob([svgText], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);

            await new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => {
                    this.assets.set(key, img);
                    URL.revokeObjectURL(url);
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Failed to load asset from blob: ${path}. The SVG file might be invalid.`);
                    URL.revokeObjectURL(url);
                    resolve();
                };
                img.src = url;
            });
        } catch (error) {
            console.warn(`An error occurred while loading asset: ${path}`, error);
        }
    }

    public getAsset(key: string): HTMLImageElement | undefined {
        return this.assets.get(key);
    }
}
