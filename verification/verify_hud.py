from playwright.sync_api import sync_playwright
import time

def verify_hud():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")

        # Wait for canvas to load
        page.wait_for_selector("canvas", state="visible")

        # Wait a bit for assets to load and HUD to render
        time.sleep(2)

        # Take screenshot
        page.screenshot(path="verification/hud_verification.png")
        print("Screenshot taken: verification/hud_verification.png")

        browser.close()

if __name__ == "__main__":
    verify_hud()
