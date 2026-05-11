/**
 * Visual top padding for screen headers.
 *
 * The actual status-bar safe area is now handled by the purple spacer
 * rendered in App.tsx using useSafeAreaInsets().top — so this constant
 * only adds comfortable breathing room between the spacer bottom and the
 * first line of header text.  14 dp works well on all device sizes.
 */
export const STATUS_TOP = 24
