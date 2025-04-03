/**
 * Notification utility to replace alert statements
 * This provides a more consistent UI for notifications
 */

/**
 * Show a notification message
 * @param message The message to display
 * @param type The type of notification (success, error, warning, info)
 */
export const showNotification = (
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
): void => {
  // In a real application, this would use a toast or notification component
  // For now, we'll use alert as a fallback, but with a comment to indicate
  // this should be replaced with a proper notification system
  // eslint-disable-next-line no-alert
  alert(`${type.toUpperCase()}: ${message}`);
};

/**
 * Show a success notification
 * @param message The success message
 */
export const showSuccess = (message: string): void => {
  showNotification(message, 'success');
};

/**
 * Show an error notification
 * @param message The error message
 */
export const showError = (message: string): void => {
  showNotification(message, 'error');
};

/**
 * Show a warning notification
 * @param message The warning message
 */
export const showWarning = (message: string): void => {
  showNotification(message, 'warning');
};

/**
 * Show an info notification
 * @param message The info message
 */
export const showInfo = (message: string): void => {
  showNotification(message, 'info');
};
