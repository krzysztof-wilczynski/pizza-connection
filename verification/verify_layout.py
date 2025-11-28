
from playwright.sync_api import sync_playwright

def verify_interior_layout():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app (assuming it's running on port 3000)
        page.goto('http://localhost:3000')

        # Wait for the app to load
        page.wait_for_selector('canvas')

        # Click on the 'Interior' view (assuming default flow or button)
        # Note: If start screen exists, might need to click 'Start'
        # Based on context, it seems to load CityView or InteriorView.
        # Let's try to click the 'Interior' button if visible or switch view.
        # However, the game starts in City view usually.
        # InteriorView button in City view might be needed.
        # But let's just take a screenshot of whatever loads first to debug.

        page.screenshot(path='verification/initial_load.png')

        # Try to find a button to switch to Interior if not there
        # The UI_LAYOUT in InteriorView suggests 'Miasto' button is red.
        # In CityView, there might be a way to enter a building.

        browser.close()

if __name__ == '__main__':
    verify_interior_layout()
