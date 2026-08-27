export function resolveCompletionNavigation(
  sequentialNextHref: string | null,
  completedNextHref: string | null | undefined
): string | null {
  return completedNextHref !== undefined ? completedNextHref : sequentialNextHref
}
