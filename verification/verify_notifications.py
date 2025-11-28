from playwright.sync_api import sync_playwright

def verify_notifications():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # NOTE: dev_output.log says port 3001
        try:
            page.goto("http://localhost:3001")
            print("Navigated to localhost:3001")
        except:
            print("Failed to navigate to localhost:3001. Checking 3000...")
            try:
                page.goto("http://localhost:3000")
                print("Navigated to localhost:3000")
            except:
                print("Failed to navigate.")
                return

        # Wait for game canvas
        try:
            page.wait_for_selector("#gameCanvas", timeout=10000)
            print("Game canvas found")
        except:
             print("Game canvas NOT found")
             # return - Commented out to try to proceed if canvas ID is wrong but page loaded


        # Verify notification area exists
        notification_area = page.locator("#notification-area")
        if notification_area.count() > 0:
            print("#notification-area found")
        else:
            print("Error: #notification-area NOT found")

        # Inject manually to verify CSS
        page.evaluate("""
            const area = document.getElementById('notification-area');
            if (area) {
                const div = document.createElement('div');
                div.className = 'notification notification-success';
                div.textContent = 'Test Notification: Success!';
                area.appendChild(div);

                const div2 = document.createElement('div');
                div2.className = 'notification notification-error';
                div2.textContent = 'Test Notification: Error!';
                area.appendChild(div2);
            }
        """)

        # Wait a bit
        page.wait_for_timeout(1000)

        # Take screenshot
        page.screenshot(path="verification/notifications.png")
        print("Screenshot saved to verification/notifications.png")

        browser.close()

if __name__ == "__main__":
    verify_notifications()
