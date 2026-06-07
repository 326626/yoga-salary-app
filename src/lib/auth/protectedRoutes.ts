const protectedRoutePrefixes = [
  "/studios",
  "/members",
  "/packages",
  "/classes",
  "/performances",
  "/salary-rules",
  "/salary-calculator",
  "/salary-history",
  "/organize",
  "/teachers"
];

export function isProtectedRoute(pathname: string) {
  return protectedRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function buildLoginRedirect(pathname: string, search = "") {
  return `/login?next=${encodeURIComponent(`${pathname}${search}`)}`;
}
