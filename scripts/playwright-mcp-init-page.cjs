exports.default = async ({ page }) => {
  await page.emulateMedia({ colorScheme: null })
}
