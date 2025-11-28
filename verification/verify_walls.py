
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Ensure server is running on 3000
        try:
            page.goto('http://localhost:3000')
            time.sleep(2) # wait for load

            # Click architecture tab
            # We need to click around coordinates where tabs are likely located
            # Or just take a screenshot of the initial state which should show walls

            page.screenshot(path='verification/interior_view.png')
        except Exception as e:
            print(f'Error: {e}')
        finally:
            browser.close()

if __name__ == '__main__':
    run()
