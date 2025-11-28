
from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Go to the local dev server
            page.goto("http://localhost:3000")

            # Wait for canvas to load
            page.wait_for_selector("canvas")

            # We need to simulate interaction to open the inventory panel.
            # Based on InteriorView.ts logic:
            # Panel is on the right side. Tabs are at the top of the panel.
            # Coordinates are approximate based on hardcoded values in InteriorView.ts
            # Canvas size defaults to window size.

            # InteriorView.ts:
            # TOP_BAR_HEIGHT = 50
            # SIDE_PANEL_WIDTH = 300
            # MASTER_TAB_HEIGHT = 40
            # Inventory Tab is index 2 (0, 1, 2)

            # Get canvas size
            viewport = page.viewport_size
            width = viewport['width']
            height = viewport['height']

            panel_x = width - 300
            # Inventory tab click (3rd tab)
            # x between panel_x + 200 and panel_x + 300
            # y between 50 and 90

            # Click Inventory Tab
            page.mouse.click(panel_x + 250, 70)

            # Wait a bit for render
            page.wait_for_timeout(500)

            # Now click "Buy" button for an ingredient
            # InventoryPanel.ts renders items starting at y + 35 (header + margin)
            # Item height 60.
            # First item button is at btnX = width - 90, btnY = currentY + 15
            # First item Y approx: 50 + 40 + 10 + 25 = 125
            # Btn Y approx: 125 + 15 = 140
            # Btn X approx: width - 90 + 40 (center)

            page.mouse.click(width - 50, 140)

            # Wait for floating text animation
            page.wait_for_timeout(200)

            # Take screenshot
            page.screenshot(path="verification/verification.png")
            print("Screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
