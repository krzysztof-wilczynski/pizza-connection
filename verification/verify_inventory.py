
import asyncio
from playwright.async_api import async_playwright

async def verify_inventory_icons():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        try:
            # 1. Open the game
            await page.goto("http://localhost:3000")

            # Wait for canvas to load
            await page.wait_for_selector("canvas")

            # Note: Since the game is canvas-based, we can't easily click UI elements via DOM.
            # However, we can click blindly or attempt to click where the 'Pantry' (Inventory) tab should be.
            # Layout from code:
            # Side Panel Width = 300 (Right aligned)
            # Master Tabs at Y = 50 (Top Bar Height)
            # Tabs: Furniture (0), Staff (1), Inventory (2)
            # Tab Width = 300 / 3 = 100
            # Inventory Tab X = (Width - 300) + 200 + 50 (center)
            # Inventory Tab Y = 50 + 20 (center)

            # Screen size 1280x720
            # Panel X = 1280 - 300 = 980
            # Inventory Tab X start = 980 + 200 = 1180
            # Inventory Tab Center X = 1180 + 50 = 1230
            # Inventory Tab Center Y = 50 + 20 = 70

            # 2. Click on "Start Game" or equivalent if needed.
            # Assuming auto-start or simple start.
            # Let's wait a bit for assets to load
            await asyncio.sleep(2)

            # Click the Inventory Tab
            await page.mouse.click(1230, 70)

            # Wait for tab switch animation/render
            await asyncio.sleep(1)

            # 3. Take Screenshot of the Panel area
            # Panel Area: x=980, y=50, w=300, h=670
            await page.screenshot(path="verification/inventory_panel.png", clip={'x': 980, 'y': 50, 'width': 300, 'height': 670})

            print("Screenshot taken: verification/inventory_panel.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_inventory_icons())
