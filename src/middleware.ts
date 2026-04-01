export { auth as middleware } from "~/server/auth";

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|signup|forgot-password|reset-password).*)",
  ],
};
