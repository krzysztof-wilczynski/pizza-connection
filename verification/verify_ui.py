from playwright.sync_api import Page, expect, sync_playwright
import time
import sys

def verify_ui(page: Page):
    print("Navigating to app...")
    page.goto("http://localhost:3000")

    print("Waiting for canvas...")
    try:
        page.wait_for_selector("canvas", timeout=5000)
    except Exception as e:
        print(f"Canvas not found: {e}")
        return

    print("Canvas found. Clicking center to enter restaurant...")
    # Assume center click enters restaurant
    page.mouse.click(400, 300)

    time.sleep(2)

    print("Taking screenshot...")
    page.screenshot(path="verification/ui_verification.png")
    print("Screenshot saved.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_ui(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
