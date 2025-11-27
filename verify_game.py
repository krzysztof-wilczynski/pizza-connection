
from playwright.sync_api import sync_playwright

def verify_assets_loaded():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Go to the local dev server
            page.goto("http://localhost:5173")

            # Wait for canvas to be present
            page.wait_for_selector("#gameCanvas")

            # Wait a bit for assets to load and render
            page.wait_for_timeout(2000)

            # Take a screenshot of the City View
            page.screenshot(path="verification_city.png")
            print("City view screenshot taken.")

            # Click on a restaurant to enter Interior View
            # Since it's a canvas, we simulate a click at a position where a restaurant is known to be.
            # Based on GameMap initialization (usually empty or specific pattern), we need to guess or click multiple spots.
            # Assuming a restaurant is at 5,5 (center-ish)
            # Center of screen is roughly width/2, height/4 + isometric offset.

            # Let's try to click in the center area where buildings usually are.
            # Screen width 800x600 (default viewport size in playwright?)
            # Viewport size defaults to 1280x720 usually.

            # Let's click the center of the screen
            width = 1280
            height = 720
            page.set_viewport_size({"width": width, "height": height})

            # Click center of screen (likely hits something in isometric view)
            page.mouse.click(width / 2, height / 2)

            # Wait for transition
            page.wait_for_timeout(1000)

            # Take screenshot of Interior View (or whatever view resulted)
            page.screenshot(path="verification_interior.png")
            print("Interior view screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_assets_loaded()
