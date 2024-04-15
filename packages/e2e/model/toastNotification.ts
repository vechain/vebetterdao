import { Page } from 'playwright';
import { expect, Locator } from '@playwright/test';

/**
 * Assert that a toast notification is displayed
 * 
 * @param page page object
 * @param title title of the toast
 * @param status status of the toast 
 */
export const expectToastToBeVisible = async (page: Page, title: string, status: "success" | "error") => {

    const xpath = `xpath=//div[@data-status="${status}"][contains(text(), "${title}")]`
    const toastTitle: Locator = page.locator(xpath).first()
    await expect(toastTitle).toBeVisible()

}